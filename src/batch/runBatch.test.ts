import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadCardCache } from "../cardData/index.js";
import { parseDecklist } from "../decklist/index.js";
import type { GameLog } from "../gameLog/index.js";
import type { GameView } from "../gameView/index.js";
import { scriptedAgent, type Action, type PlayerAgent } from "../playerAgent/index.js";
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
  it("plays one Game on the draw, writing setup, shuffle, an opening hand of 7, a keep and four events per turn", () => {
    const log = playGame({ horizon: 2 });

    expect(log.events.map((e) => [e.seq, e.turn, e.type])).toEqual([
      [0, 0, "setup"],
      [1, 0, "shuffle"],
      ...[2, 3, 4, 5, 6, 7, 8].map((seq) => [seq, 0, "draw"]),
      [9, 0, "keep"],
      [10, 1, "turn-start"],
      [11, 1, "draw"],
      [12, 1, "pass"],
      [13, 1, "turn-end"],
      [14, 2, "turn-start"],
      [15, 2, "draw"],
      [16, 2, "pass"],
      [17, 2, "turn-end"],
    ]);
    expect(log.events[0]).toMatchObject({ commanders: ["Atraxa, Praetors' Voice"], seed: 1 });
  });

  it("plays to the configured Horizon", () => {
    expect(playGame({ horizon: 6 }).events).toHaveLength(2 + 7 + 1 + 6 * 4);
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

  it("fails clearly when the Horizon draws more cards than the library holds", () => {
    // 15 cards: the opening hand of 7 plus 8 turns of draws empties it, so turn 9 cannot draw.
    expect(() => playGame({ horizon: 9 })).toThrow("Cannot draw on turn 9: the library is empty");
  });

  it("asks the Player agent once a turn, showing the turn, its hand, the command zone and the library size", () => {
    const views: GameView[] = [];
    const playerAgent: PlayerAgent = {
      ...scriptedAgent(),
      chooseAction: (view) => {
        views.push(view);
        return { type: "pass" };
      },
    };

    runBatch(decklist, { seed: 1, horizon: 3 }, { cardCache, playerAgent });

    expect(views.map((v) => [v.turn, v.horizon, v.hand.length, v.commandZone.length, v.librarySize])).toEqual([
      [1, 3, 8, 1, 7],
      [2, 3, 9, 1, 6],
      [3, 3, 10, 1, 5],
    ]);
  });

  describe("London mulligan", () => {
    function playWithMulligans(mulligans: number) {
      const { gameLogs } = runBatch(
        decklist,
        { seed: 1, horizon: 2 },
        { cardCache, playerAgent: scriptedAgent([], { mulligans }) },
      );
      return gameLogs[0]!;
    }
    const opening = (log: GameLog) => log.events.filter((e) => e.turn === 0).map((e) => e.type);

    it("keeps the first opening hand when the Player agent keeps", () => {
      expect(opening(playWithMulligans(0))).toEqual(["setup", "shuffle", ...Array<string>(7).fill("draw"), "keep"]);
      expect(playWithMulligans(0).events.find((e) => e.type === "keep")).toMatchObject({ mulligansTaken: 0 });
    });

    it("takes the first mulligan free: redraws 7, bottoms nothing", () => {
      const log = playWithMulligans(1);

      expect(log.events.find((e) => e.type === "mulligan")).toMatchObject({ mulligansTaken: 1 });

      expect(opening(log)).toEqual([
        "setup",
        "shuffle",
        ...Array<string>(7).fill("draw"),
        "mulligan",
        "shuffle",
        ...Array<string>(7).fill("draw"),
        "keep",
      ]);
      expect(log.events.filter((e) => e.type === "bottom")).toEqual([]);
    });

    it("bottoms one card for the second mulligan, as chosen by the Player agent, and logs it", () => {
      const log = playWithMulligans(2);
      const shuffles = log.events.flatMap((e) => (e.type === "shuffle" ? [e.library] : []));
      const draws = log.events.flatMap((e) => (e.type === "draw" && e.turn === 0 ? [e.card] : []));
      const thirdHand = draws.slice(14, 21);
      const bottom = log.events.find((e) => e.type === "bottom");

      expect(shuffles).toHaveLength(3);
      expect(thirdHand).toEqual(shuffles[2]!.slice(0, 7));
      // The scripted agent bottoms the last cards of its hand.
      expect(bottom).toMatchObject({ turn: 0, cards: [thirdHand[6]] });
      expect(opening(log).slice(-2)).toEqual(["keep", "bottom"]);
    });

    it("puts the bottomed cards at the bottom of the library and draws the next card from the top", () => {
      const log = playWithMulligans(3);
      const shuffles = log.events.flatMap((e) => (e.type === "shuffle" ? [e.library] : []));
      const bottom = log.events.find((e) => e.type === "bottom");
      const turnOneDraw = log.events.find((e) => e.type === "draw" && e.turn === 1);

      if (bottom?.type !== "bottom") throw new Error("no bottom event");
      expect(bottom.cards).toHaveLength(2);
      expect(turnOneDraw).toMatchObject({ card: shuffles[3]![7] });
    });

    it("shows the hand after bottoming to the Player agent on turn 1", () => {
      const views: GameView[] = [];
      const playerAgent: PlayerAgent = {
        ...scriptedAgent([], { mulligans: 3 }),
        chooseAction: (view) => {
          views.push(view);
          return { type: "pass" };
        },
      };

      runBatch(decklist, { seed: 1, horizon: 1 }, { cardCache, playerAgent });

      // 7 drawn, 2 bottomed, then the turn 1 draw.
      expect(views[0]).toMatchObject({ turn: 1, librarySize: 15 - 6 });
      expect(views[0]!.hand).toHaveLength(6);
    });

    it("produces an identical, predictable Game log for the same seed and mulligans", () => {
      expect(playWithMulligans(3)).toEqual(playWithMulligans(3));
    });

    it("shows the Player agent the mulligans taken so far at each decision", () => {
      const seen: number[] = [];
      const playerAgent: PlayerAgent = {
        ...scriptedAgent([], { mulligans: 2 }),
        chooseMulligan: (view) => {
          seen.push(view.mulligansTaken);
          return seen.length <= 2 ? "mulligan" : "keep";
        },
      };

      runBatch(decklist, { seed: 1, horizon: 1 }, { cardCache, playerAgent });

      expect(seen).toEqual([0, 1, 2]);
    });
  });
});

describe("runBatch turn rules", () => {
  const rulesDecklist = parseDecklist(
    readFileSync(fileURLToPath(new URL("./fixtures/rules-decklist.txt", import.meta.url)), "utf8"),
  );
  const PASS: Action = { type: "pass" };

  /** Plays the rules-fixture deck with a scripted Player agent; returns the rules engine events, minus turn bookkeeping. */
  function play(seed: number, horizon: number, actions: Action[]) {
    const { gameLogs } = runBatch(rulesDecklist, { seed, horizon }, { cardCache, playerAgent: scriptedAgent(actions) });
    const bookkeeping = ["setup", "shuffle", "draw", "keep", "turn-start", "turn-end", "decision", "pass"];
    return gameLogs[0]!.events.filter((e) => !bookkeeping.includes(e.type));
  }

  // Seed 14: opening hand Forest, Birds of Paradise, Rhystic Study, Jötun Grunt, Forest, Thornwood Falls, Forest;
  // then draws Sol Ring, Brainstorm, Forest, Forest.
  it("allows one land drop a turn", () => {
    const events = play(14, 2, [
      { type: "play-land", card: "Forest" },
      { type: "play-land", card: "Forest" },
      PASS,
      { type: "play-land", card: "Forest" },
    ]);

    expect(events.map((e) => [e.turn, e.type])).toEqual([
      [1, "play-land"],
      [1, "illegal-action"],
      [2, "play-land"],
    ]);
    expect(events[1]).toMatchObject({ card: "Forest", reason: "a land was already played this turn" });
  });

  it("keeps a land that entered tapped from paying for a spell until the next turn", () => {
    const events = play(14, 2, [
      { type: "play-land", card: "Thornwood Falls" },
      { type: "cast", card: "Birds of Paradise" },
      PASS,
      { type: "cast", card: "Birds of Paradise" },
    ]);

    expect(events[0]).toMatchObject({ type: "play-land", card: "Thornwood Falls", tapped: true });
    expect(events[1]).toMatchObject({ type: "illegal-action", turn: 1, reason: "cannot pay {G}" });
    expect(events.slice(2).map((e) => [e.turn, e.type])).toEqual([
      [2, "mana-spent"],
      [2, "cast"],
    ]);
  });

  it("casts a card only if its mana cost can be paid, logging each mana spent", () => {
    const events = play(14, 1, [
      { type: "play-land", card: "Forest" },
      { type: "cast", card: "Rhystic Study" },
      { type: "cast", card: "Birds of Paradise" },
      { type: "cast", card: "Jötun Grunt" },
    ]);

    expect(events.map((e) => e.type)).toEqual(["play-land", "illegal-action", "mana-spent", "cast", "illegal-action"]);
    expect(events[1]).toMatchObject({ card: "Rhystic Study", reason: "cannot pay {2}{U}" });
    expect(events[2]).toMatchObject({ land: "Forest", mana: "G" });
    expect(events[3]).toMatchObject({ card: "Birds of Paradise", manaCost: "{G}", destination: "battlefield" });
    expect(events[4]).toMatchObject({ card: "Jötun Grunt", reason: "cannot pay {1}{W}" });
  });

  it("pays coloured and generic costs from different lands", () => {
    // Seed 15: opening hand Counterspell, Command Tower, Birds of Paradise, Brainstorm, Forest, Forest, Jötun Grunt.
    const events = play(15, 2, [
      { type: "play-land", card: "Forest" },
      PASS,
      { type: "play-land", card: "Command Tower" },
      { type: "cast", card: "Jötun Grunt" },
    ]);

    const spent = events.flatMap((e) => (e.type === "mana-spent" ? [[e.land, e.mana]] : [])).sort();
    expect(spent).toEqual([
      ["Command Tower", "W"],
      ["Forest", "G"],
    ]);
    expect(events.at(-1)).toMatchObject({ type: "cast", card: "Jötun Grunt", manaCost: "{1}{W}" });
  });

  it("sends a spell that is not a permanent to the graveyard", () => {
    const events = play(15, 1, [
      { type: "play-land", card: "Command Tower" },
      { type: "cast", card: "Brainstorm" },
    ]);

    expect(events.at(-1)).toMatchObject({ type: "cast", card: "Brainstorm", destination: "graveyard" });
  });

  it.each([
    ["a card that is not in hand", { type: "cast", card: "Counterspell" }, "Counterspell is not in hand"],
    ["a commander", { type: "cast", card: "Atraxa, Praetors' Voice" }, "Atraxa, Praetors' Voice is not in hand"],
    ["a land", { type: "cast", card: "Forest" }, "Forest is a land, so it is played rather than cast"],
  ] satisfies [string, Action, string][])("rejects casting %s", (_, action, reason) => {
    expect(play(14, 1, [action])).toMatchObject([{ type: "illegal-action", reason }]);
  });

  it("rejects playing a card that is not a land", () => {
    expect(play(14, 1, [{ type: "play-land", card: "Birds of Paradise" }])).toMatchObject([
      { type: "illegal-action", reason: "Birds of Paradise is not a land" },
    ]);
  });

  it("stops a creature attacking or using a tap ability on the turn it enters, but not on a later turn", () => {
    const events = play(14, 2, [
      { type: "play-land", card: "Forest" },
      { type: "cast", card: "Birds of Paradise" },
      { type: "attack", card: "Birds of Paradise" },
      { type: "activate", card: "Birds of Paradise" },
      PASS,
      { type: "attack", card: "Birds of Paradise" },
    ]);

    const rest = events.slice(3);
    expect(rest.map((e) => [e.turn, e.type])).toEqual([
      [1, "illegal-action"],
      [1, "illegal-action"],
      [2, "attack"],
    ]);
    expect(rest[0]).toMatchObject({ reason: "Birds of Paradise has summoning sickness" });
  });

  it("lets a non-creature permanent use its tap ability the turn it enters", () => {
    // Seed 14 draws Sol Ring on turn 1; it costs {1}.
    const events = play(14, 1, [
      { type: "play-land", card: "Forest" },
      { type: "cast", card: "Sol Ring" },
      { type: "activate", card: "Sol Ring" },
    ]);

    expect(events.at(-1)).toMatchObject({ type: "activate", card: "Sol Ring" });
  });

  it("logs each Player agent decision before the rules engine events it causes", () => {
    const { gameLogs } = runBatch(
      rulesDecklist,
      { seed: 14, horizon: 1 },
      { cardCache, playerAgent: scriptedAgent([{ type: "play-land", card: "Forest" }]) },
    );

    const turn = gameLogs[0]!.events.filter((e) => e.turn === 1).map((e) => e.type);
    expect(turn).toEqual(["turn-start", "draw", "decision", "play-land", "pass", "turn-end"]);
    expect(gameLogs[0]!.events.find((e) => e.type === "decision")).toMatchObject({
      action: { type: "play-land", card: "Forest" },
    });
  });

  it("shows the Player agent its battlefield and whether the land drop is used", () => {
    const views: GameView[] = [];
    const agent = scriptedAgent([
      { type: "play-land", card: "Forest" },
      { type: "cast", card: "Birds of Paradise" },
      PASS,
    ]);
    const playerAgent: PlayerAgent = {
      ...agent,
      chooseAction: (view) => {
        views.push(view);
        return agent.chooseAction(view);
      },
    };

    runBatch(rulesDecklist, { seed: 14, horizon: 2 }, { cardCache, playerAgent });

    const seen = views.map((v) => [v.landPlayed, v.battlefield.map((p) => [p.card.name, p.tapped, p.summoningSick])]);
    expect(seen).toEqual([
      [false, []],
      [true, [["Forest", false, false]]],
      [
        true,
        [
          ["Forest", true, false],
          ["Birds of Paradise", false, true],
        ],
      ],
      [
        false,
        [
          ["Forest", false, false],
          ["Birds of Paradise", false, false],
        ],
      ],
    ]);
  });
});
