import type { CardData } from "../cardData/index.js";

/** A card the player has played onto the battlefield. */
export interface PermanentView {
  card: CardData;
  tapped: boolean;
  /** A creature that entered this turn cannot attack or use tap abilities. */
  summoningSick: boolean;
}

/** What a Player agent may see of a Game at a decision. The rules engine builds it. */
export default interface GameView {
  turn: number;
  horizon: number;
  hand: readonly CardData[];
  battlefield: readonly PermanentView[];
  commandZone: readonly CardData[];
  librarySize: number;
  /** Mulligans taken so far this Game. */
  mulligansTaken: number;
  /** Whether this turn's land drop has been used. */
  landPlayed: boolean;
}
