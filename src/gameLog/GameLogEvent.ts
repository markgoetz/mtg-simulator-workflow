/** An event before the recorder gives it a sequence number. */
export type GameLogEventBody =
  | { type: "setup"; turn: number; commanders: string[]; seed: number }
  | { type: "shuffle"; turn: number; library: string[] }
  | { type: "draw"; turn: number; card: string }
  | { type: "turn-start"; turn: number }
  | { type: "pass"; turn: number }
  | { type: "turn-end"; turn: number };

type GameLogEvent = GameLogEventBody & { seq: number };

export default GameLogEvent;
