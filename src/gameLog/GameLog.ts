import type GameLogEvent from "./GameLogEvent.js";

/** The full record of one Game, in the order things happened. */
export default interface GameLog {
  events: GameLogEvent[];
}
