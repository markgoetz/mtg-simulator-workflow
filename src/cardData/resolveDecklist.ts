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

/** Looks up every Decklist card in the card source; names that do not exist are reported by line. */
export default function resolveDecklist(decklist: Decklist, source: CardSource): ResolvedDecklist {
  const notFound: CardNotFound[] = [];
  const resolve = (entry: DecklistCard): Card | undefined => {
    const card = source.lookup(entry.name);
    if (!card)
      notFound.push({
        line: entry.line,
        name: entry.name,
        message: `Line ${entry.line}: card not found: "${entry.name}"`,
      });
    return card;
  };

  const commander = resolve(decklist.commander);
  const cards: ResolvedCard[] = [];
  for (const entry of decklist.cards) {
    const card = resolve(entry);
    if (card) cards.push({ card, quantity: entry.quantity });
  }
  notFound.sort((a, b) => a.line - b.line);
  return { commander, cards, notFound };
}
