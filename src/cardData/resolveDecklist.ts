import type { Decklist, DecklistCard } from "../decklist/index.js";
import type { CardData, CardCache } from "./loadCardCache.js";

export interface ResolvedCard {
  cardData: CardData;
  quantity: number;
  /** 1-based line number of the card in the Decklist text. */
  line: number;
}

export interface CardNotFound {
  line: number;
  name: string;
  message: string;
}

export interface ResolvedDecklist {
  /** The commanders found in the card cache; any not found are listed in `notFound`. */
  commanders: CardData[];
  cards: ResolvedCard[];
  notFound: CardNotFound[];
}

function notFoundFor(entry: DecklistCard): CardNotFound {
  return {
    line: entry.line,
    name: entry.name,
    message: `Line ${entry.line}: card not found: "${entry.name}"`,
  };
}

/** Looks up every Decklist card in the card cache; names that do not exist are reported by line. */
export default function resolveDecklist(decklist: Decklist, cache: CardCache): ResolvedDecklist {
  const lookup = (entry: DecklistCard) => ({ entry, card: cache.lookup(entry.name) });
  const commanderLookups = decklist.commanders.map(lookup);
  const cardLookups = decklist.cards.map(lookup);
  const lookups = [...commanderLookups, ...cardLookups];

  const commanders = commanderLookups.flatMap(({ card }) => (card ? [card] : []));
  const cards = cardLookups.flatMap(({ entry, card }) =>
    card ? [{ cardData: card, quantity: entry.quantity, line: entry.line }] : [],
  );
  const notFound = lookups.filter(({ card }) => !card).map(({ entry }) => notFoundFor(entry));

  return { commanders, cards, notFound: notFound.sort((a, b) => a.line - b.line) };
}
