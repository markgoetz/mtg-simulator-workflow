import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { DEFAULT_CACHE_PATH, loadCardCache, resolveDecklist } from "../cardData/index.js";
import { formatErrorsAsMarkdownTable, validateCommanderRules } from "../commanderRules/index.js";
import { parseDecklist, type DecklistCard } from "../decklist/index.js";

function formatCard(card: DecklistCard, withQuantity: boolean): string {
  const printing = card.set ? ` (${card.set}) ${card.collectorNumber}` : "";
  return `${withQuantity ? `${card.quantity} ` : ""}${card.name}${printing}`;
}

/** Runs the CLI and returns what to print. Throws an Error with a user-facing message on failure. */
export default function runCli(argv: string[]): string {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { commander: { type: "string", multiple: true }, cards: { type: "string" } },
  });
  const [path] = positionals;
  if (!path) throw new Error("Usage: decklist <decklist-file> [--commander <name>]... [--cards <card-cache-file>]");

  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      throw new Error(`Decklist file not found: ${path}`, { cause: error });
    throw error;
  }

  const decklist = parseDecklist(text, { commanders: values.commander });
  const { commanders, cards } = decklist;
  const errors = validateCommanderRules(
    decklist,
    resolveDecklist(decklist, loadCardCache(values.cards ?? DEFAULT_CACHE_PATH)),
  );
  if (errors.length > 0) {
    throw new Error(`The Decklist is not valid for Commander:\n\n${formatErrorsAsMarkdownTable(errors)}`);
  }
  const total = cards.reduce((sum, c) => sum + c.quantity, 0);
  return [
    `${commanders.length === 1 ? "Commander" : "Commanders"}: ${commanders.map((c) => formatCard(c, false)).join(" / ")}`,
    `Cards (${total}):`,
    ...cards.map((c) => `  ${formatCard(c, true)}`),
  ].join("\n");
}
