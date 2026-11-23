import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { runBatch } from "../batch/index.js";
import { DEFAULT_CACHE_PATH, loadCardCache, resolveDecklist } from "../cardData/index.js";
import { formatErrorsAsMarkdownTable, validateCommanderRules } from "../commanderRules/index.js";
import { parseDecklist, type DecklistCard } from "../decklist/index.js";
import { formatGameLog } from "../gameLog/index.js";
import { scriptedAgent } from "../playerAgent/index.js";
import parseBatchOptions from "./parseBatchOptions.js";

function formatCard(card: DecklistCard, withQuantity: boolean): string {
  const printing = card.set ? ` (${card.set}) ${card.collectorNumber}` : "";
  return `${withQuantity ? `${card.quantity} ` : ""}${card.name}${printing}`;
}

/** Runs the CLI and returns what to print. Throws an Error with a user-facing message on failure. */
export default function runCli(argv: string[]): string {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      commander: { type: "string", multiple: true },
      cards: { type: "string" },
      seed: { type: "string" },
      horizon: { type: "string" },
    },
  });
  const [path] = positionals;
  const batch = parseBatchOptions(values);
  if (!path)
    throw new Error(
      "Usage: decklist <decklist-file> [--commander <name>]... [--cards <card-cache-file>] [--seed <n> [--horizon <n>]]",
    );

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
  const cardCache = loadCardCache(values.cards ?? DEFAULT_CACHE_PATH);
  const errors = validateCommanderRules(decklist, resolveDecklist(decklist, cardCache));
  if (errors.length > 0) {
    throw new Error(`The Decklist is not valid for Commander:\n\n${formatErrorsAsMarkdownTable(errors)}`);
  }
  if (batch) {
    const { gameLogs } = runBatch(decklist, batch, { cardCache, playerAgent: scriptedAgent() });
    return formatGameLog(gameLogs[0]!);
  }
  const total = cards.reduce((sum, c) => sum + c.quantity, 0);
  return [
    `${commanders.length === 1 ? "Commander" : "Commanders"}: ${commanders.map((c) => formatCard(c, false)).join(" / ")}`,
    `Cards (${total}):`,
    ...cards.map((c) => `  ${formatCard(c, true)}`),
  ].join("\n");
}
