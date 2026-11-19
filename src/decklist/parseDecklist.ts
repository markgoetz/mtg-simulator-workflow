export interface DecklistCard {
  name: string;
  quantity: number;
  set?: string;
  collectorNumber?: string;
  /** 1-based line number in the Decklist text. */
  line: number;
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
  /** Index of the blank-line-separated block the line sits in. */
  block: number;
}

const CARD_LINE = /^(\d+)\s+(.+?)(?:\s+\(([A-Za-z0-9]+)\)\s+(\S+)(?:\s+\*\w+\*)?)?$/;

/**
 * Moxfield lists the commander last, after a blank line. Only applies when there is more than
 * one block, so a single block with no commander still reports "No commander found".
 */
function moxfieldCommander(entries: Entry[]): Entry | undefined {
  const lastBlock = entries.at(-1)?.block ?? 0;
  if (lastBlock === 0) return undefined;
  const finalBlock = entries.filter((e) => e.block === lastBlock);
  if (finalBlock.length > 1) {
    throw new Error(
      `The final block of the Decklist has ${finalBlock.length} cards, but only one commander is supported (partner commanders are not supported yet)`,
    );
  }
  return finalBlock[0];
}

export default function parseDecklist(text: string, options: ParseOptions = {}): Decklist {
  let inCommanderSection = false;
  let block = 0;
  let sawBlank = false;
  const entries: Entry[] = [];

  text.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    if (line === "") {
      sawBlank = entries.length > 0;
      return;
    }
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
      throw new Error(
        `Malformed Decklist line ${index + 1}: "${line}" (expected "<quantity> <card name> [(SET) <collector number>]")`,
      );
    }
    const card: DecklistCard = { name: match[2]!, quantity: Number(match[1]), line: index + 1 };
    if (match[3] !== undefined) {
      card.set = match[3];
      card.collectorNumber = match[4]!;
    }
    if (sawBlank) block++;
    sawBlank = false;
    entries.push({ card, inCommanderSection, block });
  });

  const commanderEntry =
    options.commander !== undefined
      ? entries.find((e) => e.card.name.toLowerCase() === options.commander!.toLowerCase())
      : (entries.find((e) => e.inCommanderSection) ?? moxfieldCommander(entries));

  if (!commanderEntry) {
    throw new Error(
      options.commander !== undefined
        ? `Commander "${options.commander}" not found in the Decklist`
        : 'No commander found: add a "Commander" section, list the commander last after a blank line, or pass --commander <name>',
    );
  }

  const commander = commanderEntry.card;
  const cards = entries.filter((e) => e !== commanderEntry).map((e) => e.card);
  return { commander, cards };
}
