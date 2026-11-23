import type { CardData } from "./loadCardCache.js";
import oracleLines from "./oracleLines.js";

/** The lowercased name a "Partner with <name>" card names as its partner; undefined if it has none. */
export default function partnerWithName(card: CardData): string | undefined {
  for (const line of oracleLines(card)) {
    const match = /^Partner with (.+?)(?: \(|$)/.exec(line);
    if (match) return match[1]!.toLowerCase();
  }
  return undefined;
}
