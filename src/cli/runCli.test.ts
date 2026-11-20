import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import runCli from "./runCli.js";

const DECKLIST = ["1 Sol Ring", "", "1 Atraxa, Praetors' Voice"].join("\n");

describe("runCli decklist file location", () => {
  it("reads the Decklist from the path as given", () => {
    const path = join(mkdtempSync(join(tmpdir(), "runCli-")), "atraxa.txt");
    writeFileSync(path, DECKLIST);

    expect(runCli([path])).toContain("Commander: Atraxa, Praetors' Voice");
  });

  it("does not look in a decks folder for a bare file name", () => {
    expect(() => runCli(["missing.txt"])).toThrow(/^Decklist file not found: missing\.txt$/);
  });

  it("prints Commanders: for a partner pair, and accepts --commander twice", () => {
    const path = join(mkdtempSync(join(tmpdir(), "runCli-")), "partners.txt");
    writeFileSync(path, ["1 Sol Ring", "1 Tymna the Weaver", "1 Thrasios, Triton Hero"].join("\n"));

    const out = runCli([path, "--commander", "Tymna the Weaver", "--commander", "Thrasios, Triton Hero"]);

    expect(out.split("\n")[0]).toBe("Commanders: Tymna the Weaver / Thrasios, Triton Hero");
    expect(out).toContain("Cards (1):");
  });

  it("lets --commander replace the Commander section and prints Commander: for one", () => {
    const path = join(mkdtempSync(join(tmpdir(), "runCli-")), "replace.txt");
    writeFileSync(path, ["Commander", "1 Tymna the Weaver", "Deck", "1 Sol Ring"].join("\n"));

    const out = runCli([path, "--commander", "Sol Ring"]);

    expect(out.split("\n").slice(0, 3)).toEqual(["Commander: Sol Ring", "Cards (1):", "  1 Tymna the Weaver"]);
  });
});
