import type { CardData } from "../cardData/index.js";

/** A card on the battlefield. */
export default interface Permanent {
  card: CardData;
  tapped: boolean;
  /** The turn it entered; a creature that entered this turn has summoning sickness. */
  enteredTurn: number;
}
