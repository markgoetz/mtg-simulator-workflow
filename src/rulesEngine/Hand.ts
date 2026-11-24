import type { CardData } from "../cardData/index.js";
import type { GameLogRecorder } from "../gameLog/index.js";
import type { GameView } from "../gameView/index.js";
import type OpeningHandChooser from "./OpeningHandChooser.js";
import shuffle from "./shuffle.js";

export const OPENING_HAND_SIZE = 7;

export interface HandDeps {
  /** The Game's library, changed in place. */
  library: CardData[];
  random: () => number;
  recorder: GameLogRecorder;
  draw: () => void;
  view: () => GameView;
}

/** The player's hand for the whole Game: it settles the opening hand (London mulligan) and then holds the cards. */
export default class Hand {
  private readonly held: CardData[] = [];
  private mulligans = 0;

  constructor(private readonly deps: HandDeps) {}

  get cards(): readonly CardData[] {
    return this.held;
  }

  get mulligansTaken(): number {
    return this.mulligans;
  }

  add(card: CardData): void {
    this.held.push(card);
  }

  /**
   * Draws 7, then asks the chooser to keep or mulligan until it keeps, and to bottom the cards owed.
   * London mulligan: the first is free, each one after it bottoms a card.
   */
  chooseOpening(chooser: OpeningHandChooser): void {
    this.drawOpening();
    // A mulligan always leaves at least one card in hand, so the 8th is never offered.
    while (this.mulligans < OPENING_HAND_SIZE && chooser.chooseMulligan(this.deps.view()) === "mulligan") {
      this.mulligan();
    }
    this.deps.recorder.record({ type: "keep", turn: 0, mulligansTaken: this.mulligans });
    const owed = Math.max(0, this.mulligans - 1);
    if (owed > 0) this.bottom(chooser.chooseBottom(this.deps.view(), owed), owed);
  }

  private mulligan(): void {
    const { library, random, recorder } = this.deps;
    this.mulligans += 1;
    recorder.record({ type: "mulligan", turn: 0, mulligansTaken: this.mulligans });
    library.splice(0, library.length, ...shuffle([...library, ...this.held], random));
    this.held.length = 0;
    recorder.record({ type: "shuffle", turn: 0, library: library.map((c) => c.name) });
    this.drawOpening();
  }

  /** Puts exactly `owed` cards from the hand on the bottom of the library; only called when `owed` is positive. */
  private bottom(cards: readonly CardData[], owed: number): void {
    const { library, recorder } = this.deps;
    if (cards.length !== owed) {
      throw new Error(`Must put ${owed} cards on the bottom of the library, got ${cards.length}`);
    }
    for (const card of cards) {
      const at = this.held.indexOf(card);
      if (at < 0) throw new Error(`Cannot put ${card.name} on the bottom: it is not in the hand`);
      this.held.splice(at, 1);
    }
    library.push(...cards);
    recorder.record({ type: "bottom", turn: 0, cards: cards.map((c) => c.name) });
  }

  private drawOpening(): void {
    for (let i = 0; i < OPENING_HAND_SIZE; i++) this.deps.draw();
  }
}
