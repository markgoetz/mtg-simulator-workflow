import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import loadCardSource from "./loadCardSource.js";

const fixture = (name: string) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
const source = () => loadCardSource(fixture("oracle-cards-sample.jsonl"));

describe("loadCardSource lookup", () => {
  it("exposes the fields the rules engine needs", () => {
    expect(source().lookup("Atraxa, Praetors' Voice")).toEqual({
      name: "Atraxa, Praetors' Voice",
      layout: "normal",
      manaCost: "{G}{W}{U}{B}",
      typeLine: "Legendary Creature — Phyrexian Angel Horror",
      oracleText: "Flying, vigilance, deathtouch, lifelink\nAt the beginning of your end step, proliferate.",
      colorIdentity: ["B", "G", "U", "W"],
      faces: [
        {
          name: "Atraxa, Praetors' Voice",
          manaCost: "{G}{W}{U}{B}",
          typeLine: "Legendary Creature — Phyrexian Angel Horror",
          oracleText: "Flying, vigilance, deathtouch, lifelink\nAt the beginning of your end step, proliferate.",
        },
      ],
    });
  });

  it("matches names ignoring case, accents, ligatures and punctuation style", () => {
    expect(source().lookup("lim-dul's vault")?.name).toBe("Lim-Dûl's Vault");
    expect(source().lookup("Jotun Grunt")?.name).toBe("Jötun Grunt");
    expect(source().lookup("Aether Vial")?.name).toBe("Æther Vial");
    expect(source().lookup("Atraxa, Praetors’ Voice")?.name).toBe("Atraxa, Praetors' Voice");
  });

  it("returns undefined for a name that does not exist", () => {
    expect(source().lookup("Sol Rong")).toBeUndefined();
  });
});

describe("loadCardSource multi-face cards", () => {
  it("matches a split card by its full name, either face or a single slash", () => {
    for (const name of ["Wear // Tear", "Wear", "Tear", "Wear / Tear", "wear//tear"]) {
      expect(source().lookup(name)?.name).toBe("Wear // Tear");
    }
  });

  it("returns per-face data for a split card", () => {
    const card = source().lookup("Fire // Ice");
    expect(card?.faces.map((f) => [f.name, f.manaCost, f.typeLine])).toEqual([
      ["Fire", "{1}{R}", "Instant"],
      ["Ice", "{1}{U}", "Instant"],
    ]);
    expect(card?.manaCost).toBe("{1}{R} // {1}{U}");
  });

  it("joins the faces' oracle text for a split card", () => {
    expect(source().lookup("Wear // Tear")?.oracleText).toBe(
      "Destroy target artifact.\n//\nDestroy target enchantment.",
    );
  });

  it("matches a double-faced card by its front or back face name", () => {
    expect(source().lookup("Delver of Secrets")?.name).toBe("Delver of Secrets // Insectile Aberration");
    expect(source().lookup("Insectile Aberration")?.name).toBe("Delver of Secrets // Insectile Aberration");
  });

  it("ignores art-series cards that share a face name with a real card", () => {
    expect(source().lookup("Delver of Secrets")?.layout).toBe("transform");
  });

  it("takes mana cost and oracle text from the front face of a double-faced card", () => {
    const card = source().lookup("Valakut Awakening // Valakut Stoneforge");
    expect(card?.manaCost).toBe("{2}{R}");
    expect(card?.oracleText).toContain("bottom of your library");
    expect(card?.faces).toHaveLength(2);
    expect(card?.faces[1]?.typeLine).toBe("Land");
  });
});

describe("loadCardSource cache errors", () => {
  it("tells the user how to refresh when the cache is missing", () => {
    expect(() => loadCardSource("/nonexistent/oracle-cards.json")).toThrow(
      /Card cache not found at \/nonexistent\/oracle-cards\.json\. Run `npm run cards:refresh`/,
    );
  });

  it("tells the user how to refresh when the cache is not valid JSON", () => {
    const path = join(mkdtempSync(join(tmpdir(), "cache-")), "oracle-cards.json");
    writeFileSync(path, "{ truncated");
    expect(() => loadCardSource(path)).toThrow(/Card cache at .* is corrupt.*npm run cards:refresh/);
  });

  it("treats an empty cache as corrupt", () => {
    const path = join(mkdtempSync(join(tmpdir(), "cache-")), "oracle-cards.jsonl");
    writeFileSync(path, "\n");
    expect(() => loadCardSource(path)).toThrow(/is corrupt \(no cards\).*npm run cards:refresh/);
  });

  it("says the cache could not be read, without a refresh hint, for other read errors", () => {
    const dir = mkdtempSync(join(tmpdir(), "cache-"));
    expect(() => loadCardSource(dir)).toThrow(/^Could not read card cache at .*: /);
  });

  it("treats a line that has a name but no type line or faces as corrupt", () => {
    const path = join(mkdtempSync(join(tmpdir(), "cache-")), "oracle-cards.jsonl");
    writeFileSync(path, '{"name":"Sol Ring","type_line":"Artifact"}\n{"name":"Half A Card"}\n');
    expect(() => loadCardSource(path)).toThrow(/line 2 is not a card/);
  });

  it("tells the user how to refresh when the cache has the wrong shape", () => {
    expect(() => loadCardSource(fixture("corrupt-cache.jsonl"))).toThrow(/is corrupt.*npm run cards:refresh/);
  });
});
