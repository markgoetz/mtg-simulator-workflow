import type { GameView } from "../gameView/index.js";
import type Action from "./Action.js";

/** The decision-maker that chooses what to do each turn. */
export default interface PlayerAgent {
  chooseAction(view: GameView): Action;
}
