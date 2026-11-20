import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import loadCardCache from "./loadCardCache.js";

const fixture = (name: string) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
const cache = () => loadCardCache(fixture("oracle-cards-sample.jsonl"));

describe("loadCardCache lookup", () => {
  it("exposes the fields the rules engine needs", () => {
    expect(cache().lookup("Atraxa, Praetors' Voice")).toEqual({
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

  it("returns undefined for a name that does not exist", () => {
    expect(cache().lookup("Sol Rong")).toBeUndefined();
  });
});

describe("loadCardCache multi-face cards", () => {
  it("matches a split card by its full name or either face name", () => {
    for (const name of ["Wear // Tear", "Wear", "Tear"]) {
      expect(cache().lookup(name)?.name).toBe("Wear // Tear");
    }
  });

  it("returns per-face data for a split card", () => {
    const card = cache().lookup("Fire // Ice");
    expect(card?.faces.map((f) => [f.name, f.manaCost, f.typeLine])).toEqual([
      ["Fire", "{1}{R}", "Instant"],
      ["Ice", "{1}{U}", "Instant"],
    ]);
    expect(card?.manaCost).toBe("{1}{R} // {1}{U}");
  });

  it("joins the faces' oracle text for a split card", () => {
    expect(cache().lookup("Wear // Tear")?.oracleText).toBe(
      "Destroy target artifact.\n//\nDestroy target enchantment.",
    );
  });

  it("matches a double-faced card by its front or back face name", () => {
    expect(cache().lookup("Delver of Secrets")?.name).toBe("Delver of Secrets // Insectile Aberration");
    expect(cache().lookup("Insectile Aberration")?.name).toBe("Delver of Secrets // Insectile Aberration");
  });

  it("ignores art-series cards that share a face name with a real card", () => {
    expect(cache().lookup("Delver of Secrets")?.layout).toBe("transform");
  });

  it("takes mana cost and oracle text from the front face of a double-faced card", () => {
    const card = cache().lookup("Valakut Awakening // Valakut Stoneforge");
    expect(card?.manaCost).toBe("{2}{R}");
    expect(card?.oracleText).toContain("bottom of your library");
    expect(card?.faces).toHaveLength(2);
    expect(card?.faces[1]?.typeLine).toBe("Land");
  });
});

describe("loadCardCache cache errors", () => {
  it("tells the user how to refresh when the cache is missing", () => {
    expect(() => loadCardCache("/nonexistent/oracle-cards.json")).toThrow(
      /Card cache not found at \/nonexistent\/oracle-cards\.json\. Run `npm run cards:refresh`/,
    );
  });

  it("tells the user how to refresh when the cache is not valid JSON", () => {
    const path = join(mkdtempSync(join(tmpdir(), "cache-")), "oracle-cards.json");
    writeFileSync(path, "{ truncated");
    expect(() => loadCardCache(path)).toThrow(/Card cache at .* is corrupt.*npm run cards:refresh/);
  });

  it("treats an empty cache as corrupt", () => {
    const path = join(mkdtempSync(join(tmpdir(), "cache-")), "oracle-cards.jsonl");
    writeFileSync(path, "\n");
    expect(() => loadCardCache(path)).toThrow(/is corrupt \(no cards\).*npm run cards:refresh/);
  });

  it("says the cache could not be read, without a refresh hint, for other read errors", () => {
    const dir = mkdtempSync(join(tmpdir(), "cache-"));
    expect(() => loadCardCache(dir)).toThrow(/^Could not read card cache at .*: /);
  });

  it("treats a line that has a name but no type line or faces as corrupt", () => {
    const path = join(mkdtempSync(join(tmpdir(), "cache-")), "oracle-cards.jsonl");
    writeFileSync(path, '{"name":"Sol Ring","type_line":"Artifact"}\n{"name":"Half A Card"}\n');
    expect(() => loadCardCache(path)).toThrow(/line 2 is not a card/);
  });

  it("tells the user how to refresh when the cache has the wrong shape", () => {
    expect(() => loadCardCache(fixture("corrupt-cache.jsonl"))).toThrow(/is corrupt.*npm run cards:refresh/);
  });
});
