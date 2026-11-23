import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import loadCardCache from "./loadCardCache.js";
import hasKeyword from "./hasKeyword.js";

const cache = loadCardCache(fileURLToPath(new URL("./fixtures/oracle-cards-sample.jsonl", import.meta.url)));
const card = (name: string) => cache.lookup(name)!;

describe("hasKeyword", () => {
  it("finds a keyword followed by reminder text", () => {
    expect(hasKeyword(card("Tymna the Weaver"), "Partner")).toBe(true);
  });

  it("finds a keyword on its own line", () => {
    expect(hasKeyword(card("Tymna the Weaver"), "Lifelink")).toBe(true);
  });

  it("does not match a keyword that only starts another one", () => {
    expect(hasKeyword(card("Pir, Imaginative Rascal"), "Partner")).toBe(false);
  });

  it("is false when the card lacks the keyword", () => {
    expect(hasKeyword(card("Sol Ring"), "Partner")).toBe(false);
  });
});
