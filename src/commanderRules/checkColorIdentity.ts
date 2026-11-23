import type { Decklist } from "../decklist/index.js";
import type { ResolvedDecklist } from "../cardData/index.js";
import type CommanderRuleError from "./CommanderRuleError.js";

const COLOR_ORDER = "WUBRG";

function sortColors(colors: Iterable<string>): string[] {
  return [...colors].sort((a, b) => COLOR_ORDER.indexOf(a) - COLOR_ORDER.indexOf(b));
}

/** Skipped when a commander is not in the card cache: its color identity is unknown, and that is reported separately. */
export default function checkColorIdentity(decklist: Decklist, resolved: ResolvedDecklist): CommanderRuleError[] {
  if (resolved.commanders.length !== decklist.commanders.length) return [];
  const allowed = new Set(resolved.commanders.flatMap((commander) => commander.colorIdentity));
  const offenders = resolved.cards
    .filter(({ cardData }) => cardData.colorIdentity.some((color) => !allowed.has(color)))
    .sort((a, b) => a.line - b.line);
  if (offenders.length === 0) return [];

  return [
    {
      kind: "colorIdentity",
      allowed: sortColors(allowed),
      cards: offenders.map(({ cardData, line }) => ({
        line,
        name: cardData.name,
        colorIdentity: sortColors(cardData.colorIdentity),
      })),
    },
  ];
}
