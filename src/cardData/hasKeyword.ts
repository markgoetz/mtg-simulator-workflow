import type { CardData } from "./loadCardCache.js";
import oracleLines from "./oracleLines.js";

/** Whether an oracle line is the keyword on its own, or the keyword followed by its reminder text in parentheses. */
export default function hasKeyword(card: CardData, keyword: string): boolean {
  return oracleLines(card).some((line) => line === keyword || line.startsWith(`${keyword} (`));
}
