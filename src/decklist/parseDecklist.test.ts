import { describe, expect, it } from "vitest";
import parseDecklist from "./parseDecklist.js";

describe("parseDecklist", () => {
  it("parses quantities and names, taking the commander from a Commander section", () => {
    const text = ["Commander", "1 Atraxa, Praetors' Voice", "", "Deck", "1 Sol Ring", "10 Forest"].join("\n");

    expect(parseDecklist(text)).toEqual({
      commanders: [{ name: "Atraxa, Praetors' Voice", quantity: 1, line: expect.any(Number) }],
      cards: [
        { name: "Sol Ring", quantity: 1, line: expect.any(Number) },
        { name: "Forest", quantity: 10, line: expect.any(Number) },
      ],
    });
  });

  it("records the 1-based line each card came from", () => {
    const text = ["Commander", "1 Atraxa, Praetors' Voice", "", "Deck", "1 Sol Ring", "10 Forest"].join("\n");

    const { commanders, cards } = parseDecklist(text);

    expect(commanders[0]!.line).toBe(2);
    expect(cards.map((c) => c.line)).toEqual([5, 6]);
  });

  it("parses set and collector-number suffixes", () => {
    const text = [
      "Commander",
      "1 Atraxa, Praetors' Voice (CM2) 10",
      "Deck",
      "1 Sol Ring (C21) 263",
      "1 Wear // Tear (DGM) 135",
      "1 Island (UNF) 235★",
    ].join("\n");

    expect(parseDecklist(text)).toEqual({
      commanders: [
        {
          name: "Atraxa, Praetors' Voice",
          quantity: 1,
          line: expect.any(Number),
          set: "CM2",
          collectorNumber: "10",
        },
      ],
      cards: [
        { name: "Sol Ring", quantity: 1, line: expect.any(Number), set: "C21", collectorNumber: "263" },
        { name: "Wear // Tear", quantity: 1, line: expect.any(Number), set: "DGM", collectorNumber: "135" },
        { name: "Island", quantity: 1, line: expect.any(Number), set: "UNF", collectorNumber: "235★" },
      ],
    });
  });

  it("takes the commander from the commanders option, removing it from the main deck", () => {
    const text = ["1 Sol Ring", "1 Atraxa, Praetors' Voice (CM2) 10", "10 Forest"].join("\n");

    expect(parseDecklist(text, { commanders: ["Atraxa, Praetors' Voice"] })).toEqual({
      commanders: [
        {
          name: "Atraxa, Praetors' Voice",
          quantity: 1,
          line: expect.any(Number),
          set: "CM2",
          collectorNumber: "10",
        },
      ],
      cards: [
        { name: "Sol Ring", quantity: 1, line: expect.any(Number) },
        { name: "Forest", quantity: 10, line: expect.any(Number) },
      ],
    });
  });

  it("lets the commanders option override the Commander section", () => {
    const text = ["Commander", "1 Atraxa, Praetors' Voice", "Deck", "1 Sol Ring", "1 Kenrith, the Returned King"].join(
      "\n",
    );

    const result = parseDecklist(text, { commanders: ["Kenrith, the Returned King"] });

    expect(result.commanders[0]!.name).toBe("Kenrith, the Returned King");
    expect(result.cards.map((c) => c.name)).toEqual(["Atraxa, Praetors' Voice", "Sol Ring"]);
  });

  it("throws when no commander is given by section or option", () => {
    expect(() => parseDecklist("1 Sol Ring")).toThrow(/commander/i);
  });

  it("throws a clear error naming the line for a malformed line", () => {
    const text = ["Commander", "1 Atraxa", "Deck", "1 Sol Ring", "Sol Ring please"].join("\n");

    expect(() => parseDecklist(text)).toThrow(/line 5.*Sol Ring please/);
  });

  it("throws when the commanders option names a card not in the Decklist", () => {
    expect(() => parseDecklist("1 Sol Ring", { commanders: ["Atraxa"] })).toThrow(/Atraxa.*not found/);
  });

  it("ignores a trailing foil/etched marker after the set and collector number", () => {
    const text = ["Commander", "1 Atraxa", "Deck", "1 Sol Ring (C21) 263 *F*"].join("\n");

    expect(parseDecklist(text).cards).toEqual([
      { name: "Sol Ring", quantity: 1, line: expect.any(Number), set: "C21", collectorNumber: "263" },
    ]);
  });

  describe("Moxfield layout (commander listed last, after a blank line)", () => {
    const moxfield = ["1 Sol Ring (C21) 263", "10 Forest", "", "1 Atraxa, Praetors' Voice (CM2) 10"].join("\n");

    it("takes the commander from the final blank-line-separated block", () => {
      expect(parseDecklist(moxfield)).toEqual({
        commanders: [
          {
            name: "Atraxa, Praetors' Voice",
            quantity: 1,
            line: expect.any(Number),
            set: "CM2",
            collectorNumber: "10",
          },
        ],
        cards: [
          { name: "Sol Ring", quantity: 1, line: expect.any(Number), set: "C21", collectorNumber: "263" },
          { name: "Forest", quantity: 10, line: expect.any(Number) },
        ],
      });
    });

    it("ignores trailing blank lines and CRLF line endings", () => {
      const result = parseDecklist(moxfield.replaceAll("\n", "\r\n") + "\r\n\r\n");

      expect(result.commanders[0]!.name).toBe("Atraxa, Praetors' Voice");
      expect(result.cards.map((c) => c.name)).toEqual(["Sol Ring", "Forest"]);
    });

    it("lets the commanders option override the final block", () => {
      const result = parseDecklist(moxfield, { commanders: ["Sol Ring"] });

      expect(result.commanders[0]!.name).toBe("Sol Ring");
      expect(result.cards.map((c) => c.name)).toEqual(["Forest", "Atraxa, Praetors' Voice"]);
    });

    it("prefers a Commander section over the final block", () => {
      const text = ["Commander", "1 Kenrith, the Returned King", "", "Deck", "1 Sol Ring", "", "1 Forest"].join("\n");

      expect(parseDecklist(text).commanders[0]!.name).toBe("Kenrith, the Returned King");
    });

    it("takes two commanders from the final block, in file order", () => {
      const text = ["1 Sol Ring", "", "1 Tymna the Weaver", "1 Thrasios, Triton Hero"].join("\n");

      const result = parseDecklist(text);

      expect(result.commanders.map((c) => c.name)).toEqual(["Tymna the Weaver", "Thrasios, Triton Hero"]);
      expect(result.cards.map((c) => c.name)).toEqual(["Sol Ring"]);
    });

    it("applies the commander rules to the final block", () => {
      expect(() => parseDecklist(["1 Sol Ring", "", "1 A", "1 B", "1 C"].join("\n"))).toThrow(
        /at most two commanders.*lines 3, 4, 5/,
      );
      expect(() => parseDecklist(["1 Sol Ring", "", "2 A"].join("\n"))).toThrow(/line 3.*quantity 2/i);
      expect(() => parseDecklist(["1 Sol Ring", "", "1 A", "1 A"].join("\n"))).toThrow(/line 4.*twice/i);
    });
  });

  describe("partner commanders", () => {
    const partners = ["Commander", "1 Tymna the Weaver", "1 Thrasios, Triton Hero", "Deck", "1 Sol Ring", "10 Forest"];

    it("parses two commanders under the Commander section, in file order", () => {
      const result = parseDecklist(partners.join("\n"));

      expect(result.commanders.map((c) => c.name)).toEqual(["Tymna the Weaver", "Thrasios, Triton Hero"]);
      expect(result.cards.map((c) => c.name)).toEqual(["Sol Ring", "Forest"]);
    });

    it("takes two commanders from the commanders option in the order given, moving others to the deck", () => {
      const text = [...partners, "1 Kenrith, the Returned King"].join("\n");

      const result = parseDecklist(text, { commanders: ["Kenrith, the Returned King", "Tymna the Weaver"] });

      expect(result.commanders.map((c) => c.name)).toEqual(["Kenrith, the Returned King", "Tymna the Weaver"]);
      expect(result.cards.map((c) => c.name)).toEqual(["Thrasios, Triton Hero", "Sol Ring", "Forest"]);
    });

    it("throws for more than two commanders, naming the lines", () => {
      const text = ["Commander", "1 A", "1 B", "1 C", "Deck", "1 Sol Ring"].join("\n");

      expect(() => parseDecklist(text)).toThrow(/at most two commanders.*3.*lines 2, 3, 4/);
      expect(() => parseDecklist(["1 A", "1 B", "1 C"].join("\n"), { commanders: ["A", "B", "C"] })).toThrow(
        /at most two/,
      );
    });

    it("throws for a commander with a quantity above 1", () => {
      const text = ["Commander", "2 Tymna the Weaver", "Deck", "1 Sol Ring"].join("\n");

      expect(() => parseDecklist(text)).toThrow(/line 2.*"Tymna the Weaver".*quantity 2/i);
      expect(() => parseDecklist("10 Forest", { commanders: ["Forest"] })).toThrow(/"Forest".*quantity 10/);
    });

    it("throws for a Commander section that is present but empty", () => {
      expect(() => parseDecklist(["Commander", "", "Deck", "1 Sol Ring"].join("\n"))).toThrow(
        /"Commander" section.*empty/,
      );
      expect(() => parseDecklist(["1 Sol Ring", "Commander"].join("\n"))).toThrow(/"Commander" section.*empty/);
    });

    it("throws when the same card is given twice as a commander", () => {
      const text = ["Commander", "1 Tymna the Weaver", "1 tymna the weaver", "Deck", "1 Sol Ring"].join("\n");

      expect(() => parseDecklist(text)).toThrow(/line 3.*"tymna the weaver".*twice/i);
      expect(() => parseDecklist("1 Sol Ring", { commanders: ["Sol Ring", "sol ring"] })).toThrow(/"sol ring".*twice/i);
    });
  });
});
