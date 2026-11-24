import { describe, expect, it } from "vitest";
import payManaCost from "./payManaCost.js";

const forest = { source: "Forest", options: ["G"] };
const tower = { source: "Tower", options: ["W", "U", "B", "G"] };

describe("payManaCost", () => {
  it("spends the flexible source on the colour only it can make", () => {
    const cost = { coloured: [["G"], ["W"]], generic: 0 };
    const payments = payManaCost(cost, [tower, forest]);
    expect(payments?.map((p) => [p.source, p.mana]).sort()).toEqual([
      ["Forest", "G"],
      ["Tower", "W"],
    ]);
  });

  it("pays the generic part with whatever is left", () => {
    expect(
      payManaCost({ coloured: [["W"]], generic: 1 }, [forest, tower])
        ?.map((p) => p.source)
        .sort(),
    ).toEqual(["Forest", "Tower"]);
  });

  it("cannot pay when no source makes the colour", () => {
    expect(payManaCost({ coloured: [["R"]], generic: 0 }, [forest, tower])).toBeUndefined();
  });

  it("cannot pay when there are too few sources", () => {
    expect(payManaCost({ coloured: [], generic: 3 }, [forest, tower])).toBeUndefined();
  });

  it("cannot pay generic mana from a source that makes no mana", () => {
    expect(payManaCost({ coloured: [], generic: 1 }, [{ source: "Dud", options: [] }])).toBeUndefined();
  });
});
