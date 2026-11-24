import type { CardData } from "../cardData/index.js";

/**
 * The mana a land can tap for, read from its "{T}: Add ..." line (ADR 0001 covers other effects later).
 * "Any color in your commander's color identity" gives the commanders' colours, or colourless if they have none.
 */
export default function landMana(card: CardData, commanderColours: readonly string[]): string[] {
  const line = /\{T\}: Add ([^.\n]*)/.exec(card.faces[0]?.oracleText ?? card.oracleText)?.[1];
  if (line === undefined) return [];
  if (/any color/.test(line)) return commanderColours.length > 0 ? [...commanderColours] : ["C"];
  return [...new Set([...line.matchAll(/\{([WUBRGC])\}/g)].map((match) => match[1]!))];
}
