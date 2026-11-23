import type GameLog from "./GameLog.js";

/** Writes a Game log as JSON lines: one event per line, in order. */
export default function formatGameLog(log: GameLog): string {
  return log.events.map((event) => JSON.stringify(event)).join("\n");
}
