import type { CardData } from "../cardData/index.js";

/** What a Player agent may see of a Game at a decision. The rules engine builds it. */
export default interface GameView {
  turn: number;
  horizon: number;
  hand: readonly CardData[];
  commandZone: readonly CardData[];
  librarySize: number;
}
