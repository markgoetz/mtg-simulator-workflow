import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseDecklist } from "../decklist/index.js";
import loadCardCache from "./loadCardCache.js";
import resolveDecklist from "./resolveDecklist.js";

const cache = loadCardCache(fileURLToPath(new URL("./fixtures/oracle-cards-sample.jsonl", import.meta.url)));

const DECKLIST = [
  "Commander",
  "1 Atraxa, Praetors' Voice (CM2) 10",
  "",
  "Deck",
  "1 Sol Ring (C21) 263",
  "1 Wear // Tear (DGM) 135",
  "1 Sol Rong",
  "10 Forest",
  "1 Jotun Grunt",
  "1 Nonexistent Card",
].join("\n");

describe("resolveDecklist", () => {
  const result = resolveDecklist(parseDecklist(DECKLIST), cache);

  it("resolves the commander and each card to Scryfall card data, keeping quantities", () => {
    expect(result.commander?.name).toBe("Atraxa, Praetors' Voice");
    expect(result.cards.map((c) => [c.cardData.name, c.quantity])).toEqual([
      ["Sol Ring", 1],
      ["Wear // Tear", 1],
      ["Forest", 10],
      ["Jötun Grunt", 1],
    ]);
  });

  it('reports each name that does not exist as "card not found" with its line, without crashing', () => {
    expect(result.notFound).toEqual([
      { line: 7, name: "Sol Rong", message: 'Line 7: card not found: "Sol Rong"' },
      { line: 10, name: "Nonexistent Card", message: 'Line 10: card not found: "Nonexistent Card"' },
    ]);
  });

  it("reports a commander that cannot be found", () => {
    const missing = resolveDecklist(parseDecklist("Commander\n1 Nobody Special\nDeck\n1 Sol Ring"), cache);
    expect(missing.commander).toBeUndefined();
    expect(missing.notFound.map((n) => n.line)).toEqual([2]);
  });
});
