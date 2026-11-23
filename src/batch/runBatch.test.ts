import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadCardCache } from "../cardData/index.js";
import { parseDecklist } from "../decklist/index.js";
import type { GameLog } from "../gameLog/index.js";
import { scriptedAgent } from "../playerAgent/index.js";
import runBatch from "./runBatch.js";

const cardCache = loadCardCache(
  fileURLToPath(new URL("../cardData/fixtures/oracle-cards-sample.jsonl", import.meta.url)),
);
const decklist = parseDecklist(
  readFileSync(fileURLToPath(new URL("./fixtures/small-decklist.txt", import.meta.url)), "utf8"),
);

const DECK_CARDS = [
  "Sol Ring",
  "Arcane Signet",
  "Command Tower",
  "Rhystic Study",
  "Cultivate",
  "Birds of Paradise",
  "Lightning Bolt",
  "Swords to Plowshares",
  "Counterspell",
  "Brainstorm",
  "Lim-Dûl's Vault",
  "Jötun Grunt",
  "Æther Vial",
  "Kodama's Reach",
  "Forest",
];

function shuffleOf(log: GameLog): string[] {
  const shuffle = log.events.find((e) => e.type === "shuffle");
  if (shuffle?.type !== "shuffle") throw new Error("no shuffle event in the Game log");
  return shuffle.library;
}

function playGame(config: { seed?: number; horizon?: number } = {}) {
  const { gameLogs } = runBatch(
    decklist,
    { seed: 1, horizon: 6, ...config },
    { cardCache, playerAgent: scriptedAgent() },
  );
  return gameLogs[0]!;
}

describe("runBatch", () => {
  it("plays one Game on the draw, writing setup, shuffle, an opening hand of 7 and four events per turn", () => {
    const log = playGame({ horizon: 2 });

    expect(log.events.map((e) => [e.seq, e.turn, e.type])).toEqual([
      [0, 0, "setup"],
      [1, 0, "shuffle"],
      ...[2, 3, 4, 5, 6, 7, 8].map((seq) => [seq, 0, "draw"]),
      [9, 1, "turn-start"],
      [10, 1, "draw"],
      [11, 1, "pass"],
      [12, 1, "turn-end"],
      [13, 2, "turn-start"],
      [14, 2, "draw"],
      [15, 2, "pass"],
      [16, 2, "turn-end"],
    ]);
    expect(log.events[0]).toMatchObject({ commanders: ["Atraxa, Praetors' Voice"] });
  });

  it("plays to the configured Horizon", () => {
    expect(playGame({ horizon: 6 }).events).toHaveLength(2 + 7 + 6 * 4);
  });

  it("produces the same Game log for the same Decklist and seed", () => {
    expect(playGame({ seed: 42 })).toEqual(playGame({ seed: 42 }));
  });

  it("shuffles the library differently for a different seed", () => {
    expect(shuffleOf(playGame({ seed: 1 }))).not.toEqual(shuffleOf(playGame({ seed: 2 })));
  });

  it("shuffles every card except the commander into the library", () => {
    expect([...shuffleOf(playGame({ seed: 7 }))].sort()).toEqual([...DECK_CARDS].sort());
  });

  it("draws the opening hand and then one card a turn from the top of the shuffled library", () => {
    const log = playGame({ seed: 7, horizon: 3 });

    const drawn = log.events.flatMap((e) => (e.type === "draw" ? [e.card] : []));
    expect(drawn).toEqual(shuffleOf(log).slice(0, 7 + 3));
  });

  it("shuffles with a mulberry32 stream and a Fisher-Yates pass, pinned for seed 1", () => {
    // Worked out independently of the code: mulberry32(1) starts 0.62707..., 0.00273...
    expect(shuffleOf(playGame({ seed: 1 }))).toEqual([
      "Rhystic Study",
      "Cultivate",
      "Kodama's Reach",
      "Arcane Signet",
      "Æther Vial",
      "Swords to Plowshares",
      "Forest",
      "Counterspell",
      "Birds of Paradise",
      "Command Tower",
      "Lim-Dûl's Vault",
      "Jötun Grunt",
      "Lightning Bolt",
      "Sol Ring",
      "Brainstorm",
    ]);
  });

  it.each([0, -1, 1.5, Number.NaN])("rejects the invalid horizon %s", (horizon) => {
    expect(() => playGame({ horizon })).toThrow(`horizon must be a positive integer, got ${horizon}`);
  });

  it.each([-1, 1.5, 4294967296])("rejects the invalid seed %s", (seed) => {
    expect(() => playGame({ seed })).toThrow(`seed must be an integer from 0 to 4294967295, got ${seed}`);
  });

  it("reports Decklist cards that are not in the card cache, by line", () => {
    const unknown = parseDecklist("Commander\n1 Atraxa, Praetors' Voice\n\nDeck\n1 Sol Ring\n1 Nonexistent Card");

    expect(() => runBatch(unknown, { seed: 1, horizon: 1 }, { cardCache, playerAgent: scriptedAgent() })).toThrow(
      'Line 6: card not found: "Nonexistent Card"',
    );
  });

  it("fails clearly when the Horizon draws more cards than the library holds", () => {
    // 15 cards: the opening hand of 7 plus 8 turns of draws empties it, so turn 9 cannot draw.
    expect(() => playGame({ horizon: 9 })).toThrow("Cannot draw on turn 9: the library is empty");
  });
});
