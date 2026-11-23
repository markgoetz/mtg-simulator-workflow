import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cli = fileURLToPath(new URL("../src/main.ts", import.meta.url));
const fixture = (name: string) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
const cards = fileURLToPath(new URL("../src/cardData/fixtures/oracle-cards-sample.jsonl", import.meta.url));

function run(...args: string[]) {
  const result = spawnSync(process.execPath, ["--import", "tsx", cli, ...args], { encoding: "utf8" });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

describe("cli", () => {
  it("prints the parsed commander and card list for a Decklist file", () => {
    const { status, stdout } = run(fixture("sample-decklist.txt"), "--cards", cards);

    expect(status).toBe(0);
    expect(stdout).toBe(
      [
        "Commander: Atraxa, Praetors' Voice (CM2) 10",
        "Cards (99):",
        "  1 Sol Ring (C21) 263",
        "  1 Arcane Signet (C21) 297",
        "  97 Forest",
        "",
      ].join("\n"),
    );
  });

  it("reads the commander from the end of a Moxfield export", () => {
    const { status, stdout } = run(fixture("moxfield-decklist.txt"), "--cards", cards);

    expect(status).toBe(0);
    expect(stdout).toContain("Commander: Atraxa, Praetors' Voice (CM2) 10");
    expect(stdout).toContain("Cards (99):");
  });

  it("takes the commander from --commander when the file has no Commander section", () => {
    const { stderr } = run(fixture("no-commander.txt"), "--commander", "Atraxa, Praetors' Voice", "--cards", cards);

    expect(stderr).toContain("Decklist has 2 cards");
  });

  it("refuses an invalid Decklist and reports every error with line numbers", () => {
    const { status, stdout, stderr } = run(fixture("invalid-decklist.txt"), "--cards", cards);

    expect(status).toBe(1);
    expect(stdout).toBe("");
    expect(stderr).toContain("The Decklist is not valid for Commander");
    expect(stderr).toContain("Decklist has 9 cards");
    expect(stderr).toContain("| Card not found | 6 | Nonexistent Card |");
    expect(stderr).toContain("| Color identity | 5 | Lightning Bolt |");
    expect(stderr).toContain("| Singleton | 5 | Lightning Bolt | 2 copies; only 1 allowed |");
  });

  it("fails with an error naming the line for a malformed Decklist", () => {
    const { status, stderr } = run(fixture("malformed.txt"), "--cards", cards);

    expect(status).toBe(1);
    expect(stderr).toMatch(/line 4.*Sol Ring please/);
  });

  it("fails when no commander is given", () => {
    const { status, stderr } = run(fixture("no-commander.txt"), "--cards", cards);

    expect(status).toBe(1);
    expect(stderr).toMatch(/commander/i);
  });

  describe("with --seed", () => {
    const play = (...extra: string[]) => run(fixture("sample-decklist.txt"), "--cards", cards, ...extra);
    const lines = (stdout: string) => stdout.trimEnd().split("\n");

    it("plays one Game to the default Horizon of 6 and prints the Game log as JSON lines", () => {
      const { status, stdout } = play("--seed", "1");

      expect(status).toBe(0);
      expect(lines(stdout)).toHaveLength(2 + 7 + 6 * 4);
      expect(lines(stdout)[0]).toBe(`{"seq":0,"type":"setup","turn":0,"commanders":["Atraxa, Praetors' Voice"]}`);
      expect(lines(stdout).at(-1)).toBe('{"seq":32,"type":"turn-end","turn":6}');
    });

    it("plays to the Horizon given by --horizon", () => {
      expect(lines(play("--seed", "1", "--horizon", "2").stdout)).toHaveLength(2 + 7 + 2 * 4);
    });

    it("prints the same Game log for the same seed and a different shuffle for a different seed", () => {
      const shuffle = (seed: string) => lines(play("--seed", seed).stdout)[1];

      expect(shuffle("5")).toBe(shuffle("5"));
      expect(shuffle("5")).not.toBe(shuffle("6"));
    });

    it("still refuses an invalid Decklist", () => {
      const { status, stdout, stderr } = run(fixture("invalid-decklist.txt"), "--cards", cards, "--seed", "1");

      expect(status).toBe(1);
      expect(stdout).toBe("");
      expect(stderr).toContain("The Decklist is not valid for Commander");
    });

    it.each(["abc", "-1", "1.5", "4294967296"])("rejects the seed %s, naming the option", (seed) => {
      const { status, stderr } = play(`--seed=${seed}`);

      expect(status).toBe(1);
      expect(stderr).toContain(`--seed must be an integer from 0 to 4294967295, got "${seed}"`);
    });

    it.each(["0", "abc", "-2"])("rejects the horizon %s, naming the option", (horizon) => {
      const { status, stderr } = play("--seed", "1", `--horizon=${horizon}`);

      expect(status).toBe(1);
      expect(stderr).toContain(`--horizon must be a positive integer, got "${horizon}"`);
    });

    it("requires --seed when --horizon is given", () => {
      const { status, stderr } = play("--horizon", "3");

      expect(status).toBe(1);
      expect(stderr).toContain("--horizon needs --seed");
    });
  });
});
