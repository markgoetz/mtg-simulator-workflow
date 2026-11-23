import type { Decklist } from "../decklist/index.js";
import type CommanderRuleError from "./CommanderRuleError.js";

export const DECK_SIZE = 100;

/** The count comes from the Decklist text, so a card missing from the card cache does not skew it. */
export default function checkCardCount(decklist: Decklist): CommanderRuleError[] {
  const count = decklist.cards.reduce((sum, card) => sum + card.quantity, decklist.commanders.length);
  if (count === DECK_SIZE) return [];
  return [{ kind: "cardCount", count, required: DECK_SIZE, commanderCount: decklist.commanders.length }];
}
