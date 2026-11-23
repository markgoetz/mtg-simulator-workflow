import type { Decklist } from "../decklist/index.js";

export const DECK_SIZE = 100;

/** The count comes from the Decklist text, so a card missing from the card cache does not skew it. */
export default function checkCardCount(decklist: Decklist): string[] {
  const total = decklist.cards.reduce((sum, card) => sum + card.quantity, decklist.commanders.length);
  if (total === DECK_SIZE) return [];
  const commander = decklist.commanders.length === 1 ? "Commander" : "Commanders";
  return [
    `Decklist has ${total} cards, but a Commander Decklist must have exactly ${DECK_SIZE} (including its ${commander}).`,
  ];
}
