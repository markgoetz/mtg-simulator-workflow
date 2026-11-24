/** A mana cost broken into what must be paid with specific mana and how much may be paid with any. */
export interface ManaCost {
  /** One entry per coloured symbol, listing the mana that can pay it (several for a hybrid symbol). */
  coloured: string[][];
  generic: number;
}

const COLOURS = new Set(["W", "U", "B", "R", "G", "C"]);

/** Parses a mana cost such as "{2}{G}{G/W}". X counts as 0 and snow as 1 generic; Phyrexian mana is paid with its colour. */
export default function parseManaCost(manaCost: string, cardName: string): ManaCost {
  const cost: ManaCost = { coloured: [], generic: 0 };
  for (const [, symbol] of manaCost.matchAll(/\{([^}]*)\}/g)) {
    const token = symbol!;
    if (/^\d+$/.test(token)) cost.generic += Number(token);
    else if (token === "S") cost.generic += 1;
    else if (token === "X") continue;
    else {
      const options = token.split("/").filter((part) => COLOURS.has(part));
      if (options.length === 0) throw new Error(`Unsupported mana symbol {${token}} in the mana cost of ${cardName}`);
      cost.coloured.push(options);
    }
  }
  return cost;
}
