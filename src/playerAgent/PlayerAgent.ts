import type { CardData } from "../cardData/index.js";
import type { GameView } from "../gameView/index.js";
import type Action from "./Action.js";
import type MulliganDecision from "./MulliganDecision.js";

/** The decision-maker that chooses what to do each turn. */
export default interface PlayerAgent {
  /** Keep the opening hand or take a mulligan. Asked until the agent keeps. */
  chooseMulligan(view: GameView): MulliganDecision;
  /** After keeping, choose `count` cards from the hand to put on the bottom of the library, in order. */
  chooseBottom(view: GameView, count: number): CardData[];
  chooseAction(view: GameView): Action;
}
