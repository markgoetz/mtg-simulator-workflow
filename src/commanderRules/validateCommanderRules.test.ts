import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadCardCache, resolveDecklist, type CardData } from "../cardData/index.js";
import { parseDecklist, type Decklist } from "../decklist/index.js";
import type CommanderRuleError from "./CommanderRuleError.js";
import validateCommanderRules from "./validateCommanderRules.js";

const cache = loadCardCache(fileURLToPath(new URL("../cardData/fixtures/oracle-cards-sample.jsonl", import.meta.url)));

function validate(lines: string[], commanders?: string[]): CommanderRuleError[] {
  const decklist = parseDecklist(lines.join("\n"), { commanders });
  return validateCommanderRules(decklist, resolveDecklist(decklist, cache));
}

const kinds = (errors: CommanderRuleError[]) => errors.map((e) => e.kind);

/** A valid Atraxa deck: 1 commander + Sol Ring + 98 Forest = 100 cards. */
const VALID = ["Commander", "1 Atraxa, Praetors' Voice", "", "Deck", "1 Sol Ring", "98 Forest"];

describe("validateCommanderRules", () => {
  it("passes a valid Decklist with no errors", () => {
    expect(validate(VALID)).toEqual([]);
  });

  it("reports the actual card count when the Decklist is not 100 cards", () => {
    const errors = validate(["Commander", "1 Atraxa, Praetors' Voice", "Deck", "1 Sol Ring", "10 Forest"]);

    expect(errors).toEqual([{ kind: "cardCount", count: 12, required: 100, commanderCount: 1 }]);
  });

  it("counts a partner pair as two of the 100 cards", () => {
    const pair = ["Commander", "1 Tymna the Weaver", "1 Thrasios, Triton Hero", "Deck", "98 Forest"];

    expect(validate(pair)).toEqual([]);
    expect(validate([...pair, "1 Sol Ring"])).toEqual([
      { kind: "cardCount", count: 101, required: 100, commanderCount: 2 },
    ]);
  });

  it("lists cards outside the commander's color identity by name and line", () => {
    const errors = validate([
      "Commander",
      "1 Tymna the Weaver",
      "Deck",
      "1 Lightning Bolt",
      "1 Counterspell",
      "97 Swamp",
    ]);

    expect(errors).toEqual([
      {
        kind: "colorIdentity",
        allowed: ["W", "B"],
        cards: [
          { line: 4, name: "Lightning Bolt", colorIdentity: ["R"] },
          { line: 5, name: "Counterspell", colorIdentity: ["U"] },
        ],
      },
    ]);
  });

  it("uses the union of both commanders' color identities", () => {
    const lines = [
      "Commander",
      "1 Tymna the Weaver",
      "1 Thrasios, Triton Hero",
      "Deck",
      "1 Lightning Bolt",
      "1 Sol Ring",
      "96 Forest",
    ];
    const [error] = validate(lines);

    expect(error).toMatchObject({ kind: "colorIdentity", allowed: ["W", "U", "B", "G"] });
    expect(error?.kind === "colorIdentity" && error.cards.map((c) => c.name)).toEqual(["Lightning Bolt"]);
  });

  it("lists a repeated card with its total count and every line, counting quantities", () => {
    const errors = validate([
      "Commander",
      "1 Atraxa, Praetors' Voice",
      "Deck",
      "2 Sol Ring",
      "1 Rhystic Study",
      "1 Rhystic Study",
      "95 Forest",
    ]);

    expect(errors).toEqual([
      {
        kind: "singleton",
        cards: [
          { name: "Sol Ring", count: 2, lines: [4] },
          { name: "Rhystic Study", count: 2, lines: [5, 6] },
        ],
      },
    ]);
  });

  it("allows any number of Basic lands and of cards that say a deck can have any number", () => {
    expect(validate(["Commander", "1 Tymna the Weaver", "Deck", "30 Relentless Rats", "69 Swamp"])).toEqual([]);
  });

  it("reports cards not in the card cache in their own error, with line numbers", () => {
    const errors = validate([
      "Commander",
      "1 Atraxa, Praetors' Voice",
      "Deck",
      "1 Sol Ring",
      "1 Nonexistent Card",
      "97 Forest",
    ]);

    expect(errors).toEqual([{ kind: "cardsNotFound", cards: [{ line: 5, name: "Nonexistent Card" }] }]);
  });

  it("reports every kind of error in one run", () => {
    const errors = validate([
      "Commander",
      "1 Tymna the Weaver",
      "Deck",
      "2 Lightning Bolt",
      "1 Nonexistent Card",
      "5 Plains",
    ]);

    expect(kinds(errors).sort()).toEqual(["cardCount", "cardsNotFound", "colorIdentity", "singleton"]);
  });

  it("skips the color identity check when a commander is not found", () => {
    const errors = validate(["Commander", "1 Not A Commander", "Deck", "1 Sol Ring", "98 Forest"]);

    expect(errors).toEqual([{ kind: "cardsNotFound", cards: [{ line: 2, name: "Not A Commander" }] }]);
  });
});

function fakeCard(name: string, oracleText: string, typeLine = "Legendary Creature — Human"): CardData {
  const face = { name, manaCost: "", typeLine, oracleText };
  return { name, layout: "normal", manaCost: "", typeLine, oracleText, colorIdentity: ["G"], faces: [face] };
}

function pairErrors(a: CardData, b: CardData): CommanderRuleError[] {
  const decklist: Decklist = {
    commanders: [
      { name: a.name, quantity: 1, line: 1 },
      { name: b.name, quantity: 1, line: 2 },
    ],
    cards: [{ name: "Forest", quantity: 98, line: 3 }],
  };
  const forest = cache.lookup("Forest")!;
  return validateCommanderRules(decklist, {
    commanders: [a, b],
    cards: [{ cardData: forest, quantity: 98, line: 3 }],
    notFound: [],
  }).filter((e) => e.kind !== "cardCount");
}

describe("partner pairing legality", () => {
  const partner = (n: string) => fakeCard(n, "Partner (You can have two commanders if both have partner.)");

  it.each([
    ["Partner", partner("A"), partner("B")],
    ["Partner with", fakeCard("A", "Partner with B (reminder)"), fakeCard("B", "Partner with A (reminder)")],
    ["Friends forever", fakeCard("A", "Friends forever"), fakeCard("B", "Friends forever")],
    ["Character select", fakeCard("A", "Character select"), fakeCard("B", "Character select")],
    ["Partner—Survivors", fakeCard("A", "Partner—Survivors"), fakeCard("B", "Partner—Survivors")],
    ["Partner—Father & Son", fakeCard("A", "Partner—Father & Son"), fakeCard("B", "Partner—Father & Son")],
    [
      "Choose a Background",
      fakeCard("A", "Choose a Background"),
      fakeCard("B", "x", "Legendary Enchantment — Background"),
    ],
    [
      "Choose a Background (reversed)",
      fakeCard("B", "x", "Legendary Enchantment — Background"),
      fakeCard("A", "Choose a Background"),
    ],
    [
      "Doctor's companion",
      fakeCard("A", "x", "Legendary Creature — Time Lord Doctor"),
      fakeCard("B", "Doctor's companion"),
    ],
  ])("accepts %s", (_name, a, b) => {
    expect(pairErrors(a, b)).toEqual([]);
  });

  it("says why a pair is illegal by recording what each commander has", () => {
    const errors = pairErrors(partner("A"), fakeCard("B", "Partner—Survivors"));

    expect(errors).toEqual([
      {
        kind: "partnerPairing",
        commanders: [
          { name: "A", line: 1, abilities: ["Partner"] },
          { name: "B", line: 2, abilities: ["Partner—Survivors"] },
        ],
      },
    ]);
  });

  it.each([
    ["two cards with no partner ability", fakeCard("A", "Flying"), fakeCard("B", "Flying")],
    ["only one with Partner", partner("A"), fakeCard("B", "Flying")],
    [
      "Partner with the wrong card",
      fakeCard("A", "Partner with C (reminder)"),
      fakeCard("B", "Partner with A (reminder)"),
    ],
    ["Partner with one-way", fakeCard("A", "Partner with B (reminder)"), partner("B")],
    ["Partner with a Partner—Survivors", partner("A"), fakeCard("B", "Partner—Survivors")],
    ["Survivors with Father & Son", fakeCard("A", "Partner—Survivors"), fakeCard("B", "Partner—Father & Son")],
    [
      "two Backgrounds",
      fakeCard("A", "x", "Legendary Enchantment — Background"),
      fakeCard("B", "x", "Legendary Enchantment — Background"),
    ],
    ["Doctor's companion without a Doctor", fakeCard("A", "Doctor's companion"), fakeCard("B", "Flying")],
  ])("rejects %s with a partnerPairing error naming both commanders and their lines", (_name, a, b) => {
    const errors = pairErrors(a, b);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      kind: "partnerPairing",
      commanders: [
        { name: "A", line: 1 },
        { name: "B", line: 2 },
      ],
    });
  });
});
