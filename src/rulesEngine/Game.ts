import type { CardData } from "../cardData/index.js";
import type { GameLogRecorder } from "../gameLog/index.js";
import type { GameView } from "../gameView/index.js";
import createRandom from "./createRandom.js";
import entersTapped from "./entersTapped.js";
import hasType from "./hasType.js";
import landMana from "./landMana.js";
import parseManaCost from "./parseManaCost.js";
import payManaCost from "./payManaCost.js";
import type Permanent from "./Permanent.js";
import shuffle from "./shuffle.js";

export const OPENING_HAND_SIZE = 7;

const PERMANENT_TYPES = ["Creature", "Artifact", "Enchantment", "Planeswalker", "Battle"];

export interface GameOptions {
  commanders: CardData[];
  /** The cards to shuffle into the library, commanders excluded. */
  library: CardData[];
  seed: number;
  horizon: number;
  recorder: GameLogRecorder;
}

type ActionType = "play-land" | "cast" | "attack" | "activate";

/** One goldfish Game: the zones and turn structure. It decides what is allowed, not what to do. */
export default class Game {
  private turn = 0;
  private library: CardData[];
  private hand: CardData[] = [];
  private battlefield: Permanent[] = [];
  private landPlayed = false;
  private readonly commanderColours: string[];

  constructor(private readonly options: GameOptions) {
    this.library = shuffle(options.library, createRandom(options.seed));
    this.commanderColours = [...new Set(options.commanders.flatMap((c) => c.colorIdentity))];
  }

  /** Shuffles the library and draws the opening hand. The player is on the draw. */
  start(): void {
    const { commanders, seed, recorder } = this.options;
    recorder.record({ type: "setup", turn: 0, commanders: commanders.map((c) => c.name), seed });
    recorder.record({ type: "shuffle", turn: 0, library: this.library.map((c) => c.name) });
    for (let i = 0; i < OPENING_HAND_SIZE; i++) this.draw();
  }

  isOver(): boolean {
    return this.turn >= this.options.horizon;
  }

  /** Untaps everything, resets the land drop and draws. */
  startTurn(): void {
    this.turn += 1;
    this.landPlayed = false;
    for (const permanent of this.battlefield) permanent.tapped = false;
    this.options.recorder.record({ type: "turn-start", turn: this.turn });
    this.draw();
  }

  endTurn(): void {
    this.options.recorder.record({ type: "turn-end", turn: this.turn });
  }

  /** Records the Player agent's decision to do nothing more this turn. */
  pass(): void {
    this.options.recorder.record({ type: "pass", turn: this.turn });
  }

  /** Plays a land from hand: one a turn, tapped if it says so. */
  playLand(name: string): void {
    const card = this.cardInHand(name);
    if (typeof card === "string") return this.reject("play-land", name, card);
    if (!hasType(card, "Land")) return this.reject("play-land", name, `${name} is not a land`);
    if (this.landPlayed) return this.reject("play-land", name, "a land was already played this turn");
    this.landPlayed = true;
    this.hand.splice(this.hand.indexOf(card), 1);
    const tapped = entersTapped(card);
    this.battlefield.push({ card, tapped, enteredTurn: this.turn });
    this.options.recorder.record({ type: "play-land", turn: this.turn, card: name, tapped });
  }

  /** Casts a card from hand by tapping untapped lands for its mana cost. Card effects are not resolved yet. */
  cast(name: string): void {
    const card = this.cardInHand(name);
    if (typeof card === "string") return this.reject("cast", name, card);
    if (hasType(card, "Land")) return this.reject("cast", name, `${name} is a land, so it is played rather than cast`);
    const manaCost = card.faces[0]?.manaCost ?? card.manaCost;
    if (manaCost === "") return this.reject("cast", name, `${name} has no mana cost`);
    const lands = this.battlefield
      .filter((p) => !p.tapped && hasType(p.card, "Land"))
      .map((land) => ({ source: land, options: landMana(land.card, this.commanderColours) }));
    const payments = payManaCost(parseManaCost(manaCost, name), lands);
    if (!payments) return this.reject("cast", name, `cannot pay ${manaCost}`);

    const { recorder } = this.options;
    for (const { source, mana } of payments) {
      source.tapped = true;
      recorder.record({ type: "mana-spent", turn: this.turn, land: source.card.name, mana });
    }
    this.hand.splice(this.hand.indexOf(card), 1);
    const isPermanent = PERMANENT_TYPES.some((type) => hasType(card, type));
    if (isPermanent) this.battlefield.push({ card, tapped: false, enteredTurn: this.turn });
    const destination = isPermanent ? "battlefield" : "graveyard";
    recorder.record({ type: "cast", turn: this.turn, card: name, manaCost, destination });
  }

  /** Attacks with a creature, tapping it. A creature that entered this turn cannot. */
  attack(name: string): void {
    const permanent = this.untappedPermanent("attack", name, (card) => hasType(card, "Creature"), "a creature");
    if (!permanent) return;
    permanent.tapped = true;
    this.options.recorder.record({ type: "attack", turn: this.turn, card: name });
  }

  /** Uses a permanent's tap ability, tapping it; the ability has no effect yet. A creature that entered this turn cannot. */
  activate(name: string): void {
    const permanent = this.untappedPermanent("activate", name, () => true, "");
    if (!permanent) return;
    permanent.tapped = true;
    this.options.recorder.record({ type: "activate", turn: this.turn, card: name });
  }

  view(): GameView {
    return {
      turn: this.turn,
      horizon: this.options.horizon,
      hand: [...this.hand],
      battlefield: this.battlefield.map((p) => ({ card: p.card, tapped: p.tapped, summoningSick: this.isSick(p) })),
      commandZone: [...this.options.commanders],
      librarySize: this.library.length,
      landPlayed: this.landPlayed,
    };
  }

  private isSick(permanent: Permanent): boolean {
    return permanent.enteredTurn === this.turn && hasType(permanent.card, "Creature");
  }

  /** Finds a permanent that may tap now, or records why none can. */
  private untappedPermanent(
    action: ActionType,
    name: string,
    allowed: (card: CardData) => boolean,
    required: string,
  ): Permanent | undefined {
    const named = this.battlefield.filter((p) => p.card.name === name);
    if (named.length === 0) return void this.reject(action, name, `${name} is not on the battlefield`);
    if (!named.every((p) => allowed(p.card))) return void this.reject(action, name, `${name} is not ${required}`);
    const ready = named.find((p) => !p.tapped && !this.isSick(p));
    if (ready) return ready;
    const reason = named.some((p) => !p.tapped) ? `${name} has summoning sickness` : `${name} is tapped`;
    return void this.reject(action, name, reason);
  }

  private cardInHand(name: string): CardData | string {
    return this.hand.find((card) => card.name === name) ?? `${name} is not in hand`;
  }

  private reject(action: ActionType, card: string, reason: string): void {
    this.options.recorder.record({ type: "illegal-action", turn: this.turn, action, card, reason });
  }

  private draw(): void {
    const card = this.library.shift();
    if (!card) throw new Error(`Cannot draw on turn ${this.turn}: the library is empty`);
    this.hand.push(card);
    this.options.recorder.record({ type: "draw", turn: this.turn, card: card.name });
  }
}
