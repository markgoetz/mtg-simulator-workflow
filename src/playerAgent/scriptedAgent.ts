import type Action from "./Action.js";
import type PlayerAgent from "./PlayerAgent.js";

/** A Player agent that gives the scripted actions in order, then passes. */
export default function scriptedAgent(actions: Action[] = []): PlayerAgent {
  let next = 0;
  return { chooseAction: () => actions[next++] ?? { type: "pass" } };
}
