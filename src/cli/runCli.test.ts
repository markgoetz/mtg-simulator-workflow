import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import runCli from "./runCli.js";

const CARDS = fileURLToPath(new URL("../cardData/fixtures/oracle-cards-sample.jsonl", import.meta.url));
const DECKLIST = ["1 Sol Ring", "98 Forest", "", "1 Atraxa, Praetors' Voice"].join("\n");

describe("runCli decklist file location", () => {
  it("reads the Decklist from the path as given", () => {
    const path = join(mkdtempSync(join(tmpdir(), "runCli-")), "atraxa.txt");
    writeFileSync(path, DECKLIST);

    expect(runCli([path, "--cards", CARDS])).toContain("Commander: Atraxa, Praetors' Voice");
  });

  it("does not look in a decks folder for a bare file name", () => {
    expect(() => runCli(["missing.txt"])).toThrow(/^Decklist file not found: missing\.txt$/);
  });

  it("prints Commanders: for a partner pair, and accepts --commander twice", () => {
    const path = join(mkdtempSync(join(tmpdir(), "runCli-")), "partners.txt");
    writeFileSync(path, ["1 Sol Ring", "97 Forest", "1 Tymna the Weaver", "1 Thrasios, Triton Hero"].join("\n"));

    const out = runCli([
      path,
      "--commander",
      "Tymna the Weaver",
      "--commander",
      "Thrasios, Triton Hero",
      "--cards",
      CARDS,
    ]);

    expect(out.split("\n")[0]).toBe("Commanders: Tymna the Weaver / Thrasios, Triton Hero");
    expect(out).toContain("Cards (98):");
  });

  it("lets --commander replace the Commander section and prints Commander: for one", () => {
    const path = join(mkdtempSync(join(tmpdir(), "runCli-")), "replace.txt");
    writeFileSync(
      path,
      ["Commander", "1 Tymna the Weaver", "Deck", "1 Atraxa, Praetors' Voice", "98 Forest"].join("\n"),
    );

    const out = runCli([path, "--commander", "Atraxa, Praetors' Voice", "--cards", CARDS]);

    expect(out.split("\n").slice(0, 3)).toEqual([
      "Commander: Atraxa, Praetors' Voice",
      "Cards (99):",
      "  1 Tymna the Weaver",
    ]);
  });
});
