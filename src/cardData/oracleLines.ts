import type { CardData } from "./loadCardCache.js";

/** The trimmed oracle text lines of every face of a card. */
export default function oracleLines(card: CardData): string[] {
  return card.faces.flatMap((face) => face.oracleText.split("\n").map((line) => line.trim()));
}
