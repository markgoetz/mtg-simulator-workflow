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
});
