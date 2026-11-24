import type { CardData } from "../cardData/index.js";
import type { GameLogRecorder } from "../gameLog/index.js";
import type { GameView } from "../gameView/index.js";
import type OpeningHandChooser from "./OpeningHandChooser.js";
import shuffle from "./shuffle.js";

export const OPENING_HAND_SIZE = 7;

export interface OpeningHandDeps {
  /** The Game's library and hand, changed in place. */
  library: CardData[];
  hand: CardData[];
  random: () => number;
  recorder: GameLogRecorder;
  draw: () => void;
  view: () => GameView;
}

/** The London mulligan: keep or redraw 7, then bottom one card per mulligan taken, the first being free. */
export default class OpeningHand {
  private mulligans = 0;

  constructor(private readonly deps: OpeningHandDeps) {}

  get mulligansTaken(): number {
    return this.mulligans;
  }

  /** Draws 7, then asks the chooser to keep or mulligan until it keeps, and to bottom the cards owed. */
  choose(chooser: OpeningHandChooser): void {
    this.drawHand();
    // A mulligan always leaves at least one card in hand, so the 8th is never offered.
    while (this.mulligans < OPENING_HAND_SIZE && chooser.chooseMulligan(this.deps.view()) === "mulligan") {
      this.mulligan();
    }
    this.deps.recorder.record({ type: "keep", turn: 0, mulligansTaken: this.mulligans });
    const owed = Math.max(0, this.mulligans - 1);
    if (owed > 0) this.bottom(chooser.chooseBottom(this.deps.view(), owed));
  }

  private mulligan(): void {
    const { library, hand, random, recorder } = this.deps;
    this.mulligans += 1;
    recorder.record({ type: "mulligan", turn: 0, mulligansTaken: this.mulligans });
    library.splice(0, library.length, ...shuffle([...library, ...hand], random));
    hand.length = 0;
    recorder.record({ type: "shuffle", turn: 0, library: library.map((c) => c.name) });
    this.drawHand();
  }

  private bottom(cards: readonly CardData[]): void {
    const { library, hand, recorder } = this.deps;
    const owed = this.mulligans - 1;
    if (cards.length !== owed) {
      throw new Error(`Must put ${owed} cards on the bottom of the library, got ${cards.length}`);
    }
    for (const card of cards) {
      const at = hand.indexOf(card);
      if (at < 0) throw new Error(`Cannot put ${card.name} on the bottom: it is not in the hand`);
      hand.splice(at, 1);
    }
    library.push(...cards);
    recorder.record({ type: "bottom", turn: 0, cards: cards.map((c) => c.name) });
  }

  private drawHand(): void {
    for (let i = 0; i < OPENING_HAND_SIZE; i++) this.deps.draw();
  }
}
