import { describe, expect, it } from "vitest";
import normalizeCardName from "./normalizeCardName.js";

describe("normalizeCardName", () => {
  it("ignores case", () => {
    expect(normalizeCardName("Sol RING")).toBe("sol ring");
  });

  it("strips accents", () => {
    expect(normalizeCardName("Lim-Dûl's Vault")).toBe("lim dul s vault");
    expect(normalizeCardName("Jötun Grunt")).toBe("jotun grunt");
  });

  it("expands the æ ligature", () => {
    expect(normalizeCardName("Æther Vial")).toBe("aether vial");
  });

  it("treats straight and curly apostrophes alike", () => {
    expect(normalizeCardName("Atraxa, Praetors’ Voice")).toBe(normalizeCardName("Atraxa, Praetors' Voice"));
  });

  it("treats double and single slashes, and any spacing around them, alike", () => {
    expect(normalizeCardName("Wear // Tear")).toBe("wear tear");
    expect(normalizeCardName("Wear / Tear")).toBe("wear tear");
    expect(normalizeCardName("wear//tear")).toBe("wear tear");
  });

  it("collapses runs of spaces and trims the ends", () => {
    expect(normalizeCardName("  Sol   Ring  ")).toBe("sol ring");
  });

  it("keeps digits", () => {
    expect(normalizeCardName("Borrowing 100,000 Arrows")).toBe("borrowing 100 000 arrows");
  });

  it("returns an empty string when nothing alphanumeric is left", () => {
    expect(normalizeCardName("—!")).toBe("");
  });
});
