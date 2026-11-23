import { randomInt } from "node:crypto";
import { MAX_SEED, type BatchConfig } from "../batch/index.js";

export const DEFAULT_HORIZON = 6;

function parseInteger(option: string, text: string, rule: string, min: number, max: number): number {
  const value = /^\d+$/.test(text) ? Number(text) : Number.NaN;
  if (!(value >= min && value <= max)) throw new Error(`--${option} must be ${rule}, got "${text}"`);
  return value;
}

/** Reads --seed and --horizon. A missing seed is chosen at random; the Game log records it. */
export default function parseBatchOptions(options: { seed?: string; horizon?: string }): BatchConfig {
  return {
    seed:
      options.seed === undefined
        ? randomInt(MAX_SEED + 1)
        : parseInteger("seed", options.seed, `an integer from 0 to ${MAX_SEED}`, 0, MAX_SEED),
    horizon:
      options.horizon === undefined
        ? DEFAULT_HORIZON
        : parseInteger("horizon", options.horizon, "a positive integer", 1, Number.MAX_SAFE_INTEGER),
  };
}
