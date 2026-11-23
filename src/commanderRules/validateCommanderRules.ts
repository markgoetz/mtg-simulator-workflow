import type { ResolvedDecklist } from "../cardData/index.js";
import type { Decklist } from "../decklist/index.js";
import type CommanderRuleError from "./CommanderRuleError.js";
import checkCardCount from "./checkCardCount.js";
import checkColorIdentity from "./checkColorIdentity.js";
import checkNotFound from "./checkNotFound.js";
import checkPartnerPairing from "./checkPartnerPairing.js";
import checkSingleton from "./checkSingleton.js";

/** Checks a resolved Decklist against Commander rules; returns every error found, or an empty list if valid. */
export default function validateCommanderRules(decklist: Decklist, resolved: ResolvedDecklist): CommanderRuleError[] {
  return [
    ...checkCardCount(decklist),
    ...checkNotFound(resolved),
    ...checkColorIdentity(decklist, resolved),
    ...checkSingleton(resolved),
    ...checkPartnerPairing(decklist, resolved.commanders),
  ];
}
