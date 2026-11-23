import type { Decklist } from "../decklist/index.js";
import type { ResolvedDecklist } from "../cardData/index.js";

const COLOR_ORDER = "WUBRG";

function sortColors(colors: Iterable<string>): string[] {
  return [...colors].sort((a, b) => COLOR_ORDER.indexOf(a) - COLOR_ORDER.indexOf(b));
}

/** Skipped when a commander is not in the card cache: its color identity is unknown, and that is reported separately. */
export default function checkColorIdentity(decklist: Decklist, resolved: ResolvedDecklist): string[] {
  if (resolved.commanders.length !== decklist.commanders.length) return [];
  const allowed = new Set(resolved.commanders.flatMap((commander) => commander.colorIdentity));
  const offenders = resolved.cards
    .filter(({ cardData }) => cardData.colorIdentity.some((color) => !allowed.has(color)))
    .sort((a, b) => a.line - b.line);
  if (offenders.length === 0) return [];

  const identity = allowed.size === 0 ? "colorless" : sortColors(allowed).join("");
  const rows = offenders.map(
    ({ cardData, line }) => `  Line ${line}: "${cardData.name}" (${sortColors(cardData.colorIdentity).join("")})`,
  );
  return [`Cards outside the Commander's color identity (${identity}):\n${rows.join("\n")}`];
}
