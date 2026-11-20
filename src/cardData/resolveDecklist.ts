import type { Decklist, DecklistCard } from "../decklist/index.js";
import type { CardData, CardCache } from "./loadCardCache.js";

export interface ResolvedCard {
  cardData: CardData;
  quantity: number;
}

export interface CardNotFound {
  line: number;
  name: string;
  message: string;
}

export interface ResolvedDecklist {
  /** Undefined when the commander's name is not in the card cache (it is then listed in `notFound`). */
  commander: CardData | undefined;
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
  const lookups = [decklist.commander, ...decklist.cards].map((entry) => ({ entry, card: cache.lookup(entry.name) }));

  const [commanderLookup, ...cardLookups] = lookups;
  const cards = cardLookups.flatMap(({ entry, card }) => (card ? [{ cardData: card, quantity: entry.quantity }] : []));
  const notFound = lookups.filter(({ card }) => !card).map(({ entry }) => notFoundFor(entry));

  return { commander: commanderLookup?.card, cards, notFound: notFound.sort((a, b) => a.line - b.line) };
}
