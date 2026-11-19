export interface DecklistCard {
  name: string;
  quantity: number;
  set?: string;
  collectorNumber?: string;
}

export interface Decklist {
  commander: DecklistCard;
  cards: DecklistCard[];
}

export interface ParseOptions {
  /** Name of the commander; overrides any `Commander` section. */
  commander?: string;
}

interface Entry {
  card: DecklistCard;
  inCommanderSection: boolean;
}

const CARD_LINE = /^(\d+)\s+(.+?)(?:\s+\(([A-Za-z0-9]+)\)\s+(\S+)(?:\s+\*\w+\*)?)?$/;

export default function parseDecklist(text: string, options: ParseOptions = {}): Decklist {
  let inCommanderSection = false;
  const entries: Entry[] = [];

  text.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    if (line === "") return;
    if (/^commander$/i.test(line)) {
      inCommanderSection = true;
      return;
    }
    if (/^deck$/i.test(line)) {
      inCommanderSection = false;
      return;
    }
    const match = CARD_LINE.exec(line);
    if (!match) {
      throw new Error(`Malformed Decklist line ${index + 1}: "${line}" (expected "<quantity> <card name> [(SET) <collector number>]")`);
    }
    const card: DecklistCard = { name: match[2]!, quantity: Number(match[1]) };
    if (match[3] !== undefined) {
      card.set = match[3];
      card.collectorNumber = match[4]!;
    }
    entries.push({ card, inCommanderSection });
  });

  const commanderEntry = options.commander !== undefined
    ? entries.find((e) => e.card.name.toLowerCase() === options.commander!.toLowerCase())
    : entries.find((e) => e.inCommanderSection);

  if (!commanderEntry) {
    throw new Error(
      options.commander !== undefined
        ? `Commander "${options.commander}" not found in the Decklist`
        : 'No commander found: add a "Commander" section to the Decklist or pass --commander <name>',
    );
  }

  const commander = commanderEntry.card;
  const cards = entries.filter((e) => e !== commanderEntry).map((e) => e.card);
  return { commander, cards };
}
