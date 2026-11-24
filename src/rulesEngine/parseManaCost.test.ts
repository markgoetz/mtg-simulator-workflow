import { describe, expect, it } from "vitest";
import parseManaCost from "./parseManaCost.js";

describe("parseManaCost", () => {
  it("separates generic mana from coloured symbols", () => {
    expect(parseManaCost("{2}{U}{U}", "Test")).toEqual({ coloured: [["U"], ["U"]], generic: 2 });
  });

  it("lets a hybrid symbol be paid with either colour", () => {
    expect(parseManaCost("{G/W}", "Test")).toEqual({ coloured: [["G", "W"]], generic: 0 });
  });

  it("pays Phyrexian mana with its colour, counts X as 0 and snow as 1 generic", () => {
    expect(parseManaCost("{X}{S}{G/P}", "Test")).toEqual({ coloured: [["G"]], generic: 1 });
  });

  it("has no cost for an empty mana cost", () => {
    expect(parseManaCost("", "Test")).toEqual({ coloured: [], generic: 0 });
  });

  it("names the card when a symbol is not supported", () => {
    expect(() => parseManaCost("{Z}", "Odd Card")).toThrow("Unsupported mana symbol {Z} in the mana cost of Odd Card");
  });
});
