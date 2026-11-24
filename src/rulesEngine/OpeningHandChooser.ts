import type { CardData } from "../cardData/index.js";
import type { GameView } from "../gameView/index.js";

/** What the rules engine asks of a Player agent about its opening hand. A Player agent satisfies it structurally. */
export default interface OpeningHandChooser {
  /** Keep the opening hand or take a mulligan. Asked until the chooser keeps. */
  chooseMulligan(view: GameView): "keep" | "mulligan";
  /** After keeping, choose `count` cards from the hand to put on the bottom of the library, in order. */
  chooseBottom(view: GameView, count: number): CardData[];
}
