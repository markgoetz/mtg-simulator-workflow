import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import runCli from "./runCli.js";

const CARDS = fileURLToPath(new URL("../cardData/fixtures/oracle-cards-sample.jsonl", import.meta.url));
const DECKLIST = ["1 Sol Ring", "98 Forest", "", "1 Atraxa, Praetors' Voice"].join("\n");

const events = (out: string): Record<string, unknown>[] => out.split("\n").map((line) => JSON.parse(line));

describe("runCli decklist file location", () => {
  it("reads the Decklist from the path as given", () => {
    const path = join(mkdtempSync(join(tmpdir(), "runCli-")), "atraxa.txt");
    writeFileSync(path, DECKLIST);

    expect(events(runCli([path, "--cards", CARDS]))[0]).toMatchObject({ commanders: ["Atraxa, Praetors' Voice"] });
  });

  it("does not look in a decks folder for a bare file name", () => {
    expect(() => runCli(["missing.txt"])).toThrow(/^Decklist file not found: missing\.txt$/);
  });

  it("plays with both commanders in the command zone for a partner pair, and accepts --commander twice", () => {
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

    const [setup, shuffle] = events(out);
    expect(setup).toMatchObject({ commanders: ["Tymna the Weaver", "Thrasios, Triton Hero"] });
    expect(shuffle?.library).toHaveLength(98);
  });

  it("lets --commander replace the Commander section", () => {
    const path = join(mkdtempSync(join(tmpdir(), "runCli-")), "replace.txt");
    writeFileSync(
      path,
      ["Commander", "1 Tymna the Weaver", "Deck", "1 Atraxa, Praetors' Voice", "98 Forest"].join("\n"),
    );

    const out = runCli([path, "--commander", "Atraxa, Praetors' Voice", "--cards", CARDS]);

    const [setup, shuffle] = events(out);
    expect(setup).toMatchObject({ commanders: ["Atraxa, Praetors' Voice"] });
    expect(shuffle?.library).toContain("Tymna the Weaver");
  });
});
