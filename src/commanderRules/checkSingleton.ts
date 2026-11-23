import type { CardData, ResolvedDecklist } from "../cardData/index.js";
import type CommanderRuleError from "./CommanderRuleError.js";

function isBasicLand(card: CardData): boolean {
  return /\bBasic\b/.test(card.typeLine);
}

function allowsAnyNumber(card: CardData): boolean {
  return card.faces.some((face) => /a deck can have any number of cards named/i.test(face.oracleText));
}

export default function checkSingleton(resolved: ResolvedDecklist): CommanderRuleError[] {
  const byName = new Map<string, { card: CardData; count: number; lines: number[] }>();
  for (const { cardData, quantity, line } of resolved.cards) {
    const entry = byName.get(cardData.name) ?? { card: cardData, count: 0, lines: [] };
    entry.count += quantity;
    entry.lines.push(line);
    byName.set(cardData.name, entry);
  }
  const repeated = [...byName.values()]
    .filter(({ card, count }) => count > 1 && !isBasicLand(card) && !allowsAnyNumber(card))
    .sort((a, b) => Math.min(...a.lines) - Math.min(...b.lines));
  if (repeated.length === 0) return [];

  return [{ kind: "singleton", cards: repeated.map(({ card, count, lines }) => ({ name: card.name, count, lines })) }];
}
