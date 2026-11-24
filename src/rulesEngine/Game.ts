import type { CardData } from "../cardData/index.js";
import type { GameLogRecorder } from "../gameLog/index.js";
import type { GameView } from "../gameView/index.js";
import createRandom from "./createRandom.js";
import shuffle from "./shuffle.js";

export const OPENING_HAND_SIZE = 7;

export interface GameOptions {
  commanders: CardData[];
  /** The cards to shuffle into the library, commanders excluded. */
  library: CardData[];
  seed: number;
  horizon: number;
  recorder: GameLogRecorder;
}

/** One goldfish Game: the zones and turn structure. It decides what is allowed, not what to do. */
export default class Game {
  private turn = 0;
  private library: CardData[];
  private hand: CardData[] = [];
  private mulligansTaken = 0;
  private readonly random: () => number;

  constructor(private readonly options: GameOptions) {
    this.random = createRandom(options.seed);
    this.library = shuffle(options.library, this.random);
  }

  /** Shuffles the library and draws the opening hand. The player is on the draw. */
  start(): void {
    const { commanders, seed, recorder } = this.options;
    recorder.record({ type: "setup", turn: 0, commanders: commanders.map((c) => c.name), seed });
    recorder.record({ type: "shuffle", turn: 0, library: this.library.map((c) => c.name) });
    this.drawOpeningHand();
  }

  /** A mulligan always leaves at least one card in hand. */
  canMulligan(): boolean {
    return this.mulligansTaken < OPENING_HAND_SIZE;
  }

  /** London mulligan: shuffles the hand back into the library and draws 7 again. */
  mulligan(): void {
    if (!this.canMulligan()) throw new Error(`Cannot mulligan more than ${OPENING_HAND_SIZE} times`);
    this.mulligansTaken += 1;
    this.library = shuffle([...this.library, ...this.hand], this.random);
    this.hand = [];
    this.options.recorder.record({ type: "shuffle", turn: 0, library: this.library.map((c) => c.name) });
    this.drawOpeningHand();
  }

  /** The first mulligan is free; each one after it costs a card put on the bottom. */
  cardsToBottom(): number {
    return Math.max(0, this.mulligansTaken - 1);
  }

  /** Moves the chosen cards from the hand to the bottom of the library, in the order given. */
  bottom(cards: readonly CardData[]): void {
    if (cards.length !== this.cardsToBottom()) {
      throw new Error(`Must put ${this.cardsToBottom()} cards on the bottom of the library, got ${cards.length}`);
    }
    const remaining = [...this.hand];
    for (const card of cards) {
      const at = remaining.indexOf(card);
      if (at < 0) throw new Error(`Cannot put ${card.name} on the bottom: it is not in the hand`);
      remaining.splice(at, 1);
    }
    this.hand = remaining;
    this.library.push(...cards);
    this.options.recorder.record({ type: "bottom", turn: 0, cards: cards.map((c) => c.name) });
  }

  isOver(): boolean {
    return this.turn >= this.options.horizon;
  }

  startTurn(): void {
    this.turn += 1;
    this.options.recorder.record({ type: "turn-start", turn: this.turn });
    this.draw();
  }

  endTurn(): void {
    this.options.recorder.record({ type: "turn-end", turn: this.turn });
  }

  view(): GameView {
    return {
      turn: this.turn,
      horizon: this.options.horizon,
      hand: [...this.hand],
      commandZone: [...this.options.commanders],
      librarySize: this.library.length,
      mulligansTaken: this.mulligansTaken,
    };
  }

  private drawOpeningHand(): void {
    for (let i = 0; i < OPENING_HAND_SIZE; i++) this.draw();
  }

  private draw(): void {
    const card = this.library.shift();
    if (!card) throw new Error(`Cannot draw on turn ${this.turn}: the library is empty`);
    this.hand.push(card);
    this.options.recorder.record({ type: "draw", turn: this.turn, card: card.name });
  }
}
