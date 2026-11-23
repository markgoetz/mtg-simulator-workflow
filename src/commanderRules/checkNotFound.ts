import type { ResolvedDecklist } from "../cardData/index.js";
import type CommanderRuleError from "./CommanderRuleError.js";

export default function checkNotFound(resolved: ResolvedDecklist): CommanderRuleError[] {
  if (resolved.notFound.length === 0) return [];
  return [{ kind: "cardsNotFound", cards: resolved.notFound.map(({ line, name }) => ({ line, name })) }];
}
