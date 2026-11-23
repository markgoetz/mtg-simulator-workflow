import type { ResolvedDecklist } from "../cardData/index.js";

export default function checkNotFound(resolved: ResolvedDecklist): string[] {
  if (resolved.notFound.length === 0) return [];
  const cards = resolved.notFound.map((card) => `line ${card.line} "${card.name}"`);
  return [`Cards not found in the card cache: ${cards.join(", ")}.`];
}
