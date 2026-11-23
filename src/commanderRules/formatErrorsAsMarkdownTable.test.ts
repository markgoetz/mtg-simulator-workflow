import { describe, expect, it } from "vitest";
import type CommanderRuleError from "./CommanderRuleError.js";
import formatErrorsAsMarkdownTable from "./formatErrorsAsMarkdownTable.js";

describe("formatErrorsAsMarkdownTable", () => {
  it("returns an empty string when there are no errors", () => {
    expect(formatErrorsAsMarkdownTable([])).toBe("");
  });

  it("formats each kind of error as rows under one header", () => {
    const errors: CommanderRuleError[] = [
      { kind: "cardCount", count: 98, required: 100, commanderCount: 1 },
      { kind: "cardsNotFound", cards: [{ line: 7, name: "Sol Rong" }] },
      {
        kind: "colorIdentity",
        allowed: ["W", "B"],
        cards: [{ line: 4, name: "Lightning Bolt", colorIdentity: ["R"] }],
      },
      { kind: "singleton", cards: [{ name: "Rhystic Study", count: 2, lines: [5, 6] }] },
      {
        kind: "partnerPairing",
        commanders: [
          { name: "A", line: 1, abilities: ["Partner"] },
          { name: "B", line: 2, abilities: [] },
        ],
      },
    ];

    const lines = formatErrorsAsMarkdownTable(errors).split("\n");

    expect(lines.slice(0, 7)).toEqual([
      "| Rule | Line(s) | Card | Problem |",
      "| --- | --- | --- | --- |",
      "| Card count |  |  | Decklist has 98 cards, but must have exactly 100 (including its Commander) |",
      "| Card not found | 7 | Sol Rong | Unknown card |",
      "| Color identity | 4 | Lightning Bolt | Card is R; the Commander's color identity is WB |",
      "| Singleton | 5, 6 | Rhystic Study | 2 copies; only 1 allowed |",
      expect.stringMatching(
        /^\| Partner pairing \| 1, 2 \| A \/ B \| A has Partner; B has no partner ability\. A legal pair/,
      ),
    ]);
    expect(lines).toHaveLength(7);
  });

  it("escapes pipes in card names so a row keeps its columns", () => {
    const table = formatErrorsAsMarkdownTable([{ kind: "cardsNotFound", cards: [{ line: 1, name: "A | B" }] }]);

    expect(table).toContain("| A \\| B |");
  });
});
