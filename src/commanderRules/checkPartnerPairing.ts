import { hasKeyword, partnerWithName, type CardData } from "../cardData/index.js";
import type { Decklist } from "../decklist/index.js";
import type CommanderRuleError from "./CommanderRuleError.js";

/** Keywords that let two commanders pair when both have the same one. */
const SHARED_KEYWORDS = ["Partner", "Friends forever", "Character select", "Partner—Survivors", "Partner—Father & Son"];

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
function abilitiesOf(card: CardData): string[] {
  const withName = partnerWithName(card);
  return [
    ...SHARED_KEYWORDS.filter((keyword) => hasKeyword(card, keyword)),
    ...(withName ? [`Partner with ${withName}`] : []),
    ...(hasKeyword(card, "Choose a Background") ? ["Choose a Background"] : []),
    ...(hasKeyword(card, "Doctor's companion") ? ["Doctor's companion"] : []),
    ...(/\bBackground\b/.test(card.typeLine) ? ["Background"] : []),
    ...(/\bTime Lord Doctor\b/.test(card.typeLine) ? ["Time Lord Doctor"] : []),
  ];
}

/** Only for two commanders that are both in the card cache; legality comes from card data, not the Decklist text. */
export default function checkPartnerPairing(decklist: Decklist, commanders: CardData[]): CommanderRuleError[] {
  if (decklist.commanders.length !== 2 || commanders.length !== 2) return [];
  const [a, b] = commanders as [CardData, CardData];
  if (isLegalPair(a, b)) return [];
  return [
    {
      kind: "partnerPairing",
      commanders: commanders.map((card, index) => ({
        name: card.name,
        line: decklist.commanders[index]!.line,
        abilities: abilitiesOf(card),
      })),
    },
  ];
}
