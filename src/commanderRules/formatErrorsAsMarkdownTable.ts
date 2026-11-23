import type CommanderRuleError from "./CommanderRuleError.js";

const HEADER = ["Rule", "Line(s)", "Card", "Problem"];

const LEGAL_PAIRS =
  "A legal pair shares Partner, Friends forever, Character select, Partner—Survivors or Partner—Father & Son; " +
  "names each other with Partner with; is a Choose a Background commander and a Background; " +
  "or is a Time Lord Doctor and a Doctor's companion.";

const colors = (identity: string[]) => (identity.length === 0 ? "colorless" : identity.join(""));

function rowsFor(error: CommanderRuleError): string[][] {
  switch (error.kind) {
    case "cardCount": {
      const commander = error.commanderCount === 1 ? "Commander" : "Commanders";
      return [
        [
          "Card count",
          "",
          "",
          `Decklist has ${error.count} cards, but must have exactly ${error.required} (including its ${commander})`,
        ],
      ];
    }
    case "cardsNotFound":
      return error.cards.map((c) => ["Card not found", String(c.line), c.name, "Not in the card cache"]);
    case "colorIdentity":
      return error.cards.map((c) => [
        "Color identity",
        String(c.line),
        c.name,
        `Card is ${colors(c.colorIdentity)}; the Commander's color identity is ${colors(error.allowed)}`,
      ]);
    case "singleton":
      return error.cards.map((c) => ["Singleton", c.lines.join(", "), c.name, `${c.count} copies; only 1 allowed`]);
    case "partnerPairing": {
      const [a, b] = error.commanders;
      const has = (c: { name: string; abilities: string[] }) =>
        `${c.name} has ${c.abilities.length === 0 ? "no partner ability" : c.abilities.join(", ")}`;
      return [
        [
          "Partner pairing",
          error.commanders.map((c) => c.line).join(", "),
          error.commanders.map((c) => c.name).join(" / "),
          `${has(a!)}; ${has(b!)}. ${LEGAL_PAIRS}`,
        ],
      ];
    }
  }
}

const cell = (text: string) => text.replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ");
const row = (cells: string[]) => `| ${cells.map(cell).join(" | ")} |`;

/** Formats errors as a Markdown table, one row per offending card; an empty string if there are none. */
export default function formatErrorsAsMarkdownTable(errors: CommanderRuleError[]): string {
  const rows = errors.flatMap(rowsFor);
  if (rows.length === 0) return "";
  return [row(HEADER), row(HEADER.map(() => "---")), ...rows.map(row)].join("\n");
}
