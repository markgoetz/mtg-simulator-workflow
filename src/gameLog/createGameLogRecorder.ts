import type GameLog from "./GameLog.js";
import type GameLogEvent from "./GameLogEvent.js";
import type { GameLogEventBody } from "./GameLogEvent.js";

export interface GameLogRecorder {
  record(event: GameLogEventBody): void;
  log(): GameLog;
}

/** Collects events into a Game log, numbering them in the order they are recorded. */
export default function createGameLogRecorder(): GameLogRecorder {
  const events: GameLog["events"] = [];
  return {
    record: (event) => {
      events.push({ seq: events.length, ...event } as GameLogEvent);
    },
    log: () => ({ events: [...events] }),
  };
}
