import type { CardData } from "../cardData/index.js";

/** Whether the card always enters tapped. A conditional "enters tapped unless ..." enters untapped for now. */
export default function entersTapped(card: CardData): boolean {
  const text = card.faces[0]?.oracleText ?? card.oracleText;
  return /\benters (the battlefield )?tapped\.?\s*$/m.test(text);
}
