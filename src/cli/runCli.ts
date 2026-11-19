import { readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { parseDecklist, type DecklistCard } from "../decklist/index.js";

function formatCard(card: DecklistCard, withQuantity: boolean): string {
  const printing = card.set ? ` (${card.set}) ${card.collectorNumber}` : "";
  return `${withQuantity ? `${card.quantity} ` : ""}${card.name}${printing}`;
}

/** The gitignored folder, at the project root, where bare Decklist file names are looked up. */
const DEFAULT_DECKS_DIR = fileURLToPath(new URL("../../decks", import.meta.url));

export interface RunCliOptions {
  decksDir?: string;
}

/** A file name with no folder (`atraxa.txt`) is read from the decks folder; any other path is used as given. */
function resolveDecklistPath(path: string, decksDir: string): string {
  return basename(path) === path ? join(decksDir, path) : path;
}

/** Runs the CLI and returns what to print. Throws an Error with a user-facing message on failure. */
export default function runCli(argv: string[], { decksDir = DEFAULT_DECKS_DIR }: RunCliOptions = {}): string {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { commander: { type: "string" } },
  });
  const [path] = positionals;
  if (!path)
    throw new Error(
      "Usage: decklist <decklist-file> [--commander <name>] (a file name with no folder is read from decks/)",
    );

  const file = resolveDecklistPath(path, decksDir);
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      throw new Error(`Decklist file not found: ${file}`, { cause: error });
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
