/** Reduces a card name to a comparison key: no case, accents, ligatures or punctuation. */
export default function normalizeCardName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
