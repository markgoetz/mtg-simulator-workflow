import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import runCli from "./runCli.js";

const DECKLIST = ["1 Sol Ring", "", "1 Atraxa, Praetors' Voice"].join("\n");

describe("runCli decklist file location", () => {
  let root: string;
  let decksDir: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "runCli-"));
    decksDir = join(root, "decks");
    mkdirSync(decksDir);
    mkdirSync(join(root, "elsewhere"));
  });

  it("looks in the decks folder when the file name has no folder", () => {
    writeFileSync(join(decksDir, "atraxa.txt"), DECKLIST);

    expect(runCli(["atraxa.txt"], { decksDir })).toContain("Commander: Atraxa, Praetors' Voice");
  });

  it("uses a path that includes a folder as given, not from the decks folder", () => {
    const path = join(root, "elsewhere", "atraxa.txt");
    writeFileSync(path, DECKLIST);

    expect(runCli([path], { decksDir })).toContain("Commander: Atraxa, Praetors' Voice");
  });

  it("names the decks folder path when a bare file name is not found", () => {
    expect(() => runCli(["missing.txt"], { decksDir })).toThrow(join(decksDir, "missing.txt"));
  });
});
