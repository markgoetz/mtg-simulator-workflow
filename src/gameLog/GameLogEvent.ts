/** An event before the recorder gives it a sequence number. */
export type GameLogEventBody =
  | { type: "setup"; turn: number; commanders: string[]; seed: number }
  | { type: "shuffle"; turn: number; library: string[] }
  | { type: "draw"; turn: number; card: string }
  | { type: "keep"; turn: number; mulligansTaken: number }
  | { type: "mulligan"; turn: number; mulligansTaken: number }
  | { type: "bottom"; turn: number; cards: string[] }
  | { type: "turn-start"; turn: number }
  // Player agent decisions
  | { type: "decision"; turn: number; action: { type: string; card?: string } }
  | { type: "pass"; turn: number }
  // Rules engine events
  | { type: "play-land"; turn: number; card: string; tapped: boolean }
  | { type: "mana-spent"; turn: number; land: string; mana: string }
  | { type: "cast"; turn: number; card: string; manaCost: string; destination: "battlefield" | "graveyard" }
  | { type: "attack"; turn: number; card: string }
  | { type: "activate"; turn: number; card: string }
  | { type: "illegal-action"; turn: number; action: string; card: string; reason: string }
  | { type: "turn-end"; turn: number };

type GameLogEvent = GameLogEventBody & { seq: number };

export default GameLogEvent;
