import type { CardData } from "../cardData/index.js";

/** Whether the card's front face has the card type (such as "Land" or "Creature"); subtypes after the dash are ignored. */
export default function hasType(card: CardData, type: string): boolean {
  const frontTypeLine = card.faces[0]?.typeLine ?? card.typeLine;
  const types = frontTypeLine.split("—")[0]!.split(/\s+/);
  return types.includes(type);
}
