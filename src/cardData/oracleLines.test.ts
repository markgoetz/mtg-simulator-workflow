import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import loadCardCache from "./loadCardCache.js";
import oracleLines from "./oracleLines.js";

const cache = loadCardCache(fileURLToPath(new URL("./fixtures/oracle-cards-sample.jsonl", import.meta.url)));
const card = (name: string) => cache.lookup(name)!;

describe("oracleLines", () => {
  it("splits a card's oracle text into its lines", () => {
    const lines = oracleLines(card("Tymna the Weaver"));

    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe("Lifelink");
  });

  it("includes the lines of every face", () => {
    const lines = oracleLines(card("Wear // Tear"));

    expect(lines.length).toBeGreaterThanOrEqual(card("Wear // Tear").faces.length);
  });
});
