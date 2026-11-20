import { readFileSync } from "node:fs";
import normalizeCardName from "./normalizeCardName.js";

export interface CardFace {
  name: string;
  manaCost: string;
  typeLine: string;
  oracleText: string;
}

export interface CardData {
  name: string;
  layout: string;
  /** Front face mana cost; for split cards, the faces joined with " // ". */
  manaCost: string;
  typeLine: string;
  /** Front face oracle text; for split cards, the faces joined with a "//" line. */
  oracleText: string;
  colorIdentity: string[];
  /** One entry for a single-faced card, one per face otherwise. */
  faces: CardFace[];
}

export interface CardCache {
  /** Finds a card by full name, face name or single-slash name; undefined if there is none. */
  lookup(name: string): CardData | undefined;
}

interface ScryfallFace {
  name?: string;
  mana_cost?: string;
  type_line?: string;
  oracle_text?: string;
}

interface ScryfallCard extends ScryfallFace {
  name: string;
  layout?: string;
  color_identity?: string[];
  card_faces?: ScryfallFace[];
}

const REFRESH_HINT = "Run `npm run cards:refresh` to download the card cache again.";

function toFace(raw: ScryfallFace, fallbackName: string): CardFace {
  return {
    name: raw.name ?? fallbackName,
    manaCost: raw.mana_cost ?? "",
    typeLine: raw.type_line ?? "",
    oracleText: raw.oracle_text ?? "",
  };
}

function toCardData(raw: ScryfallCard): CardData {
  const faces = raw.card_faces?.length ? raw.card_faces.map((f) => toFace(f, raw.name)) : [toFace(raw, raw.name)];
  const front = faces[0]!;
  const split = raw.layout === "split" || raw.layout === "flip" || raw.layout === "adventure";
  return {
    name: raw.name,
    layout: raw.layout ?? "normal",
    manaCost: raw.mana_cost ?? (split ? faces.map((f) => f.manaCost).join(" // ") : front.manaCost),
    typeLine: raw.type_line ?? faces.map((f) => f.typeLine).join(" // "),
    oracleText: raw.oracle_text ?? (split ? faces.map((f) => f.oracleText).join("\n//\n") : front.oracleText),
    colorIdentity: raw.color_identity ?? [],
    faces,
  };
}

/** Layouts that are not playable cards; art-series cards would otherwise shadow real face names. */
const NON_CARD_LAYOUTS = new Set(["art_series", "token", "double_faced_token", "emblem"]);

function isScryfallCard(value: unknown): value is ScryfallCard {
  if (typeof value !== "object" || value === null) return false;
  const card = value as ScryfallCard;
  return typeof card.name === "string" && (typeof card.type_line === "string" || Array.isArray(card.card_faces));
}

function readCards(path: string): ScryfallCard[] {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      throw new Error(`Card cache not found at ${path}. ${REFRESH_HINT}`, { cause: error });
    throw new Error(`Could not read card cache at ${path}: ${(error as Error).message}`, { cause: error });
  }
  const cards: ScryfallCard[] = [];
  text.split(/\r?\n/).forEach((line, index) => {
    if (line.trim() === "") return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch (error) {
      throw new Error(`Card cache at ${path} is corrupt (line ${index + 1} is not valid JSON). ${REFRESH_HINT}`, {
        cause: error,
      });
    }
    if (!isScryfallCard(parsed))
      throw new Error(`Card cache at ${path} is corrupt (line ${index + 1} is not a card). ${REFRESH_HINT}`);
    cards.push(parsed);
  });
  if (cards.length === 0) throw new Error(`Card cache at ${path} is corrupt (no cards). ${REFRESH_HINT}`);
  return cards;
}

/** Reads the cached Scryfall Oracle bulk file at `path`. Throws a user-facing Error if it is missing or corrupt. */
export default function loadCardCache(path: string): CardCache {
  const byName = new Map<string, CardData>();
  const byFace = new Map<string, CardData>();
  for (const raw of readCards(path)) {
    if (NON_CARD_LAYOUTS.has(raw.layout ?? "")) continue;
    const card = toCardData(raw);
    byName.set(normalizeCardName(card.name), card);
    if (card.faces.length > 1) {
      for (const face of card.faces) {
        const key = normalizeCardName(face.name);
        if (!byFace.has(key)) byFace.set(key, card);
      }
    }
  }
  return {
    lookup(name) {
      const key = normalizeCardName(name);
      return byName.get(key) ?? byFace.get(key);
    },
  };
}
