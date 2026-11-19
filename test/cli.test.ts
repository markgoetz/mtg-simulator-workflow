import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cli = fileURLToPath(new URL("../src/cli.ts", import.meta.url));
const fixture = (name: string) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));

function run(...args: string[]) {
  const result = spawnSync(process.execPath, ["--import", "tsx", cli, ...args], { encoding: "utf8" });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

describe("cli", () => {
  it("prints the parsed commander and card list for a Decklist file", () => {
    const { status, stdout } = run(fixture("sample-decklist.txt"));

    expect(status).toBe(0);
    expect(stdout).toBe(
      [
        "Commander: Atraxa, Praetors' Voice (CM2) 10",
        "Cards (12):",
        "  1 Sol Ring (C21) 263",
        "  1 Arcane Signet (C21) 297",
        "  10 Forest",
        "",
      ].join("\n"),
    );
  });

  it("takes the commander from --commander when the file has no Commander section", () => {
    const { status, stdout } = run(fixture("no-commander.txt"), "--commander", "Atraxa, Praetors' Voice");

    expect(status).toBe(0);
    expect(stdout).toContain("Commander: Atraxa, Praetors' Voice");
    expect(stdout).toContain("Cards (1):");
  });

  it("fails with an error naming the line for a malformed Decklist", () => {
    const { status, stderr } = run(fixture("malformed.txt"));

    expect(status).toBe(1);
    expect(stderr).toMatch(/line 4.*Sol Ring please/);
  });

  it("fails when no commander is given", () => {
    const { status, stderr } = run(fixture("no-commander.txt"));

    expect(status).toBe(1);
    expect(stderr).toMatch(/commander/i);
  });
});
