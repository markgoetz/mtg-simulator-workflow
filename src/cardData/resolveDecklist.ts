import type { Decklist, DecklistCard } from "../decklist/index.js";
import type { Card, CardSource } from "./loadCardSource.js";

export interface ResolvedCard {
  card: Card;
  quantity: number;
}

export interface CardNotFound {
  line: number;
  name: string;
  message: string;
}

export interface ResolvedDecklist {
  /** Undefined when the commander's name is not in the card data (it is then listed in `notFound`). */
  commander: Card | undefined;
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

/** Looks up every Decklist card in the card source; names that do not exist are reported by line. */
export default function resolveDecklist(decklist: Decklist, source: CardSource): ResolvedDecklist {
  const lookups = [decklist.commander, ...decklist.cards].map((entry) => ({ entry, card: source.lookup(entry.name) }));

  const [commanderLookup, ...cardLookups] = lookups;
  const cards = cardLookups.flatMap(({ entry, card }) => (card ? [{ card, quantity: entry.quantity }] : []));
  const notFound = lookups.filter(({ card }) => !card).map(({ entry }) => notFoundFor(entry));

  return { commander: commanderLookup?.card, cards, notFound: notFound.sort((a, b) => a.line - b.line) };
}
