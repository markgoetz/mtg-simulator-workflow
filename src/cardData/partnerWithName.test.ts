import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import loadCardCache from "./loadCardCache.js";
import partnerWithName from "./partnerWithName.js";

const cache = loadCardCache(fileURLToPath(new URL("./fixtures/oracle-cards-sample.jsonl", import.meta.url)));
const card = (name: string) => cache.lookup(name)!;

describe("partnerWithName", () => {
  it("returns the lowercased partner's name without the reminder text", () => {
    expect(partnerWithName(card("Pir, Imaginative Rascal"))).toBe("toothy, imaginative friend");
  });

  it("is undefined for a card without Partner with", () => {
    expect(partnerWithName(card("Tymna the Weaver"))).toBeUndefined();
  });
});
