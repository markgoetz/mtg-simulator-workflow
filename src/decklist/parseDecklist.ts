export interface DecklistCard {
  name: string;
  quantity: number;
  set?: string;
  collectorNumber?: string;
  /** 1-based line number in the Decklist text. */
  line: number;
}

export interface Decklist {
  /** One or two commanders, in the order given. The order carries no meaning. */
  commanders: DecklistCard[];
  cards: DecklistCard[];
}

export interface ParseOptions {
  /** Names of the commanders; fully replaces any `Commander` section. */
  commanders?: string[];
}

interface Entry {
  card: DecklistCard;
  inCommanderSection: boolean;
  /** Index of the blank-line-separated block the line sits in. */
  block: number;
}

const CARD_LINE = /^(\d+)\s+(.+?)(?:\s+\(([A-Za-z0-9]+)\)\s+(\S+)(?:\s+\*\w+\*)?)?$/;

/**
 * Moxfield lists the commanders last, after a blank line. Only applies when there is more than
 * one block, so a single block with no commander still reports "No commander found".
 */
function moxfieldCommanders(entries: Entry[]): Entry[] {
  const lastBlock = entries.at(-1)?.block ?? 0;
  if (lastBlock === 0) return [];
  return entries.filter((e) => e.block === lastBlock);
}

function validateCommanders(commanders: Entry[]): void {
  if (commanders.length > 2) {
    const lines = commanders.map((e) => e.card.line).join(", ");
    throw new Error(`A Decklist has at most two commanders, but ${commanders.length} were given (lines ${lines})`);
  }
  const seen = new Set<string>();
  for (const { card } of commanders) {
    if (card.quantity > 1) {
      throw new Error(`Line ${card.line}: commander "${card.name}" has quantity ${card.quantity}, but must be 1`);
    }
    const key = card.name.toLowerCase();
    if (seen.has(key)) throw new Error(`Line ${card.line}: commander "${card.name}" is given twice`);
    seen.add(key);
  }
}

function commandersFromNames(entries: Entry[], names: string[]): Entry[] {
  const seen = new Set<string>();
  return names.map((name) => {
    const key = name.toLowerCase();
    if (seen.has(key)) throw new Error(`Commander "${name}" is given twice`);
    seen.add(key);
    const entry = entries.find((e) => e.card.name.toLowerCase() === key);
    if (!entry) throw new Error(`Commander "${name}" not found in the Decklist`);
    return entry;
  });
}

export default function parseDecklist(text: string, options: ParseOptions = {}): Decklist {
  let inCommanderSection = false;
  let sawCommanderSection = false;
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
      sawCommanderSection = true;
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

  const names = options.commanders ?? [];
  let commanderEntries: Entry[];
  if (names.length > 0) {
    commanderEntries = commandersFromNames(entries, names);
  } else {
    commanderEntries = entries.filter((e) => e.inCommanderSection);
    if (sawCommanderSection && commanderEntries.length === 0) {
      throw new Error('The "Commander" section of the Decklist is empty: list one or two commanders under it');
    }
    if (!sawCommanderSection) commanderEntries = moxfieldCommanders(entries);
  }

  if (commanderEntries.length === 0) {
    throw new Error(
      'No commander found: add a "Commander" section, list the commander last after a blank line, or pass --commander <name>',
    );
  }
  validateCommanders(commanderEntries);

  const commanders = commanderEntries.map((e) => e.card);
  const cards = entries.filter((e) => !commanderEntries.includes(e)).map((e) => e.card);
  return { commanders, cards };
}
