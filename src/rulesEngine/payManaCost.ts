import type { ManaCost } from "./parseManaCost.js";

export interface ManaSource<T> {
  source: T;
  /** The mana it can produce; it produces one mana when tapped. */
  options: string[];
}

export interface ManaPayment<T> {
  source: T;
  mana: string;
}

/**
 * Pays a cost by tapping sources, each giving one mana. Coloured symbols are matched to distinct sources
 * (trying the least flexible sources first), then any remaining sources pay the generic part.
 * Returns undefined when the cost cannot be paid.
 */
export default function payManaCost<T>(cost: ManaCost, sources: ManaSource<T>[]): ManaPayment<T>[] | undefined {
  if (sources.length < cost.coloured.length + cost.generic) return undefined;
  const ordered = [...sources].sort((a, b) => a.options.length - b.options.length);

  const assign = (symbol: number, used: Map<number, string>): Map<number, string> | undefined => {
    if (symbol === cost.coloured.length) return used;
    for (const [index, { options }] of ordered.entries()) {
      if (used.has(index)) continue;
      const mana = cost.coloured[symbol]!.find((colour) => options.includes(colour));
      if (mana === undefined) continue;
      const result = assign(symbol + 1, new Map(used).set(index, mana));
      if (result) return result;
    }
    return undefined;
  };

  const coloured = assign(0, new Map());
  if (!coloured) return undefined;
  const payments: ManaPayment<T>[] = [];
  let genericLeft = cost.generic;
  for (const [index, { source, options }] of ordered.entries()) {
    const mana = coloured.get(index);
    if (mana !== undefined) payments.push({ source, mana });
    else if (genericLeft > 0 && options.length > 0) {
      genericLeft -= 1;
      payments.push({ source, mana: options[0]! });
    }
  }
  return genericLeft === 0 ? payments : undefined;
}
