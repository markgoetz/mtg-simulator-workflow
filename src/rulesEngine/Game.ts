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

  constructor(private readonly options: GameOptions) {
    this.library = shuffle(options.library, createRandom(options.seed));
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
    };
  }

  private draw(): void {
    const card = this.library.shift();
    if (!card) throw new Error(`Cannot draw on turn ${this.turn}: the library is empty`);
    this.hand.push(card);
    this.options.recorder.record({ type: "draw", turn: this.turn, card: card.name });
  }
}
