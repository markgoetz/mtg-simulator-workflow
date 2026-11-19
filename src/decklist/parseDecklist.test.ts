import { describe, expect, it } from "vitest";
import parseDecklist from "./parseDecklist.js";

describe("parseDecklist", () => {
  it("parses quantities and names, taking the commander from a Commander section", () => {
    const text = ["Commander", "1 Atraxa, Praetors' Voice", "", "Deck", "1 Sol Ring", "10 Forest"].join("\n");

    expect(parseDecklist(text)).toEqual({
      commander: { name: "Atraxa, Praetors' Voice", quantity: 1 },
      cards: [
        { name: "Sol Ring", quantity: 1 },
        { name: "Forest", quantity: 10 },
      ],
    });
  });

  it("parses set and collector-number suffixes", () => {
    const text = ["Commander", "1 Atraxa, Praetors' Voice (CM2) 10", "Deck", "1 Sol Ring (C21) 263", "1 Wear // Tear (DGM) 135", "1 Island (UNF) 235★"].join("\n");

    expect(parseDecklist(text)).toEqual({
      commander: { name: "Atraxa, Praetors' Voice", quantity: 1, set: "CM2", collectorNumber: "10" },
      cards: [
        { name: "Sol Ring", quantity: 1, set: "C21", collectorNumber: "263" },
        { name: "Wear // Tear", quantity: 1, set: "DGM", collectorNumber: "135" },
        { name: "Island", quantity: 1, set: "UNF", collectorNumber: "235★" },
      ],
    });
  });

  it("takes the commander from the commander option, removing it from the main deck", () => {
    const text = ["1 Sol Ring", "1 Atraxa, Praetors' Voice (CM2) 10", "10 Forest"].join("\n");

    expect(parseDecklist(text, { commander: "Atraxa, Praetors' Voice" })).toEqual({
      commander: { name: "Atraxa, Praetors' Voice", quantity: 1, set: "CM2", collectorNumber: "10" },
      cards: [
        { name: "Sol Ring", quantity: 1 },
        { name: "Forest", quantity: 10 },
      ],
    });
  });

  it("lets the commander option override the Commander section", () => {
    const text = ["Commander", "1 Atraxa, Praetors' Voice", "Deck", "1 Sol Ring", "1 Kenrith, the Returned King"].join("\n");

    const result = parseDecklist(text, { commander: "Kenrith, the Returned King" });

    expect(result.commander.name).toBe("Kenrith, the Returned King");
    expect(result.cards.map((c) => c.name)).toEqual(["Atraxa, Praetors' Voice", "Sol Ring"]);
  });

  it("throws when no commander is given by section or option", () => {
    expect(() => parseDecklist("1 Sol Ring")).toThrow(/commander/i);
  });

  it("throws a clear error naming the line for a malformed line", () => {
    const text = ["Commander", "1 Atraxa", "Deck", "1 Sol Ring", "Sol Ring please"].join("\n");

    expect(() => parseDecklist(text)).toThrow(/line 5.*Sol Ring please/);
  });

  it("throws when the commander option names a card not in the Decklist", () => {
    expect(() => parseDecklist("1 Sol Ring", { commander: "Atraxa" })).toThrow(/Atraxa.*not found/);
  });

  it("ignores a trailing foil/etched marker after the set and collector number", () => {
    const text = ["Commander", "1 Atraxa", "Deck", "1 Sol Ring (C21) 263 *F*"].join("\n");

    expect(parseDecklist(text).cards).toEqual([{ name: "Sol Ring", quantity: 1, set: "C21", collectorNumber: "263" }]);
  });
});
