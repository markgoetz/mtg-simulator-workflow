import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { parseDecklist, type DecklistCard } from "./decklist.js";

function formatCard(card: DecklistCard, withQuantity: boolean): string {
  const printing = card.set ? ` (${card.set}) ${card.collectorNumber}` : "";
  return `${withQuantity ? `${card.quantity} ` : ""}${card.name}${printing}`;
}

function main(argv: string[]): void {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { commander: { type: "string" } },
  });
  const [path] = positionals;
  if (!path) throw new Error("Usage: decklist <decklist-file> [--commander <name>]");

  const { commander, cards } = parseDecklist(readFileSync(path, "utf8"), { commander: values.commander });
  const total = cards.reduce((sum, c) => sum + c.quantity, 0);
  const lines = [`Commander: ${formatCard(commander, false)}`, `Cards (${total}):`, ...cards.map((c) => `  ${formatCard(c, true)}`)];
  console.log(lines.join("\n"));
}

try {
  main(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
