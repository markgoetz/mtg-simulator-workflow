/** One way a Decklist breaks Commander rules, as data. Format it for people with `formatErrorsAsMarkdownTable`. */
type CommanderRuleError =
  | {
      kind: "cardCount";
      /** Commanders plus every card quantity in the Decklist. */
      count: number;
      required: number;
      commanderCount: number;
    }
  | { kind: "cardsNotFound"; cards: { line: number; name: string }[] }
  | {
      kind: "colorIdentity";
      /** The union of the commanders' color identities, in WUBRG order. */
      allowed: string[];
      cards: { line: number; name: string; colorIdentity: string[] }[];
    }
  | { kind: "singleton"; cards: { name: string; count: number; lines: number[] }[] }
  | {
      kind: "partnerPairing";
      /** What each commander offers for pairing, e.g. "Partner" or "Time Lord Doctor"; empty if nothing. */
      commanders: { name: string; line: number; abilities: string[] }[];
    };

export default CommanderRuleError;
