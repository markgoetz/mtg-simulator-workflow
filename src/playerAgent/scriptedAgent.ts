import type Action from "./Action.js";
import type PlayerAgent from "./PlayerAgent.js";

export interface ScriptedAgentOptions {
  /** How many times to mulligan before keeping. Defaults to none. */
  mulligans?: number;
}

/** A Player agent that gives the scripted actions in order, then passes. It bottoms the last cards of its hand. */
export default function scriptedAgent(actions: Action[] = [], options: ScriptedAgentOptions = {}): PlayerAgent {
  let next = 0;
  return {
    chooseMulligan: (view) => (view.mulligansTaken < (options.mulligans ?? 0) ? "mulligan" : "keep"),
    chooseBottom: (view, count) => view.hand.slice(view.hand.length - count),
    chooseAction: () => actions[next++] ?? { type: "pass" },
  };
}
