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
});
