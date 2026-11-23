import { MAX_SEED } from "../batch/index.js";

export const DEFAULT_HORIZON = 6;

function parseInteger(option: string, text: string, rule: string, min: number, max: number): number {
  const value = /^\d+$/.test(text) ? Number(text) : Number.NaN;
  if (!(value >= min && value <= max)) throw new Error(`--${option} must be ${rule}, got "${text}"`);
  return value;
}

/** Reads --seed and --horizon; returns undefined when no Game was asked for (no --seed). */
export default function parseBatchOptions(options: {
  seed?: string;
  horizon?: string;
}): { seed: number; horizon: number } | undefined {
  if (options.seed === undefined) {
    if (options.horizon !== undefined) throw new Error("--horizon needs --seed");
    return undefined;
  }
  return {
    seed: parseInteger("seed", options.seed, `an integer from 0 to ${MAX_SEED}`, 0, MAX_SEED),
    horizon:
      options.horizon === undefined
        ? DEFAULT_HORIZON
        : parseInteger("horizon", options.horizon, "a positive integer", 1, Number.MAX_SAFE_INTEGER),
  };
}
