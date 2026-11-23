import type { CardData } from "../cardData/index.js";
import type { Decklist } from "../decklist/index.js";
import formatLines from "./formatLines.js";

/** Keywords that let two commanders pair when both have the same one. */
const SHARED_KEYWORDS = ["Partner", "Friends forever", "Character select", "Partner—Survivors", "Partner—Father & Son"];

function oracleLines(card: CardData): string[] {
  return card.faces.flatMap((face) => face.oracleText.split("\n").map((line) => line.trim()));
}

function hasKeyword(card: CardData, keyword: string): boolean {
  return oracleLines(card).some((line) => line === keyword || line.startsWith(`${keyword} (`));
}

function partnerWithName(card: CardData): string | undefined {
  for (const line of oracleLines(card)) {
    const match = /^Partner with (.+?)(?: \(|$)/.exec(line);
    if (match) return match[1]!.toLowerCase();
  }
  return undefined;
}

function isLegalPair(a: CardData, b: CardData): boolean {
  if (SHARED_KEYWORDS.some((keyword) => hasKeyword(a, keyword) && hasKeyword(b, keyword))) return true;
  if (partnerWithName(a) === b.name.toLowerCase() && partnerWithName(b) === a.name.toLowerCase()) return true;
  const background = (chooser: CardData, other: CardData) =>
    hasKeyword(chooser, "Choose a Background") && /\bBackground\b/.test(other.typeLine);
  if (background(a, b) || background(b, a)) return true;
  const doctor = (companion: CardData, other: CardData) =>
    hasKeyword(companion, "Doctor's companion") && /\bTime Lord Doctor\b/.test(other.typeLine);
  return doctor(a, b) || doctor(b, a);
}

/** What each commander offers for pairing, so the error can say why two cards do not match. */
function describeAbilities(card: CardData): string {
  const abilities = [
    ...SHARED_KEYWORDS.filter((keyword) => hasKeyword(card, keyword)),
    ...(partnerWithName(card) ? [`Partner with ${partnerWithName(card)}`] : []),
    ...(hasKeyword(card, "Choose a Background") ? ["Choose a Background"] : []),
    ...(hasKeyword(card, "Doctor's companion") ? ["Doctor's companion"] : []),
    ...(/\bBackground\b/.test(card.typeLine) ? ["Background"] : []),
    ...(/\bTime Lord Doctor\b/.test(card.typeLine) ? ["Time Lord Doctor"] : []),
  ];
  return abilities.length === 0 ? "no partner ability" : abilities.join(", ");
}

/** Only for two commanders that are both in the card cache; legality comes from card data, not the Decklist text. */
export default function checkPartnerPairing(decklist: Decklist, commanders: CardData[]): string[] {
  if (decklist.commanders.length !== 2 || commanders.length !== 2) return [];
  const [a, b] = commanders as [CardData, CardData];
  if (isLegalPair(a, b)) return [];
  const lines = formatLines(decklist.commanders.map((commander) => commander.line));
  return [
    `Illegal partner pairing: "${a.name}" and "${b.name}" (${lines}) cannot both be Commanders. ` +
      `"${a.name}" has ${describeAbilities(a)}; "${b.name}" has ${describeAbilities(b)}. ` +
      "A legal pair shares Partner, Friends forever, Character select, Partner—Survivors or Partner—Father & Son; " +
      "names each other with Partner with; is a Choose a Background commander and a Background; " +
      "or is a Time Lord Doctor and a Doctor's companion.",
  ];
}
