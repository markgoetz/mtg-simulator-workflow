import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
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
    options: { commander: { type: "string" } },
  });
  const [path] = positionals;
  if (!path) throw new Error("Usage: decklist <decklist-file> [--commander <name>]");

  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      throw new Error(`Decklist file not found: ${path}`, { cause: error });
    throw error;
  }

  const { commander, cards } = parseDecklist(text, { commander: values.commander });
  const total = cards.reduce((sum, c) => sum + c.quantity, 0);
  return [
    `Commander: ${formatCard(commander, false)}`,
    `Cards (${total}):`,
    ...cards.map((c) => `  ${formatCard(c, true)}`),
  ].join("\n");
}
