import type { BatchConfig } from "./runBatch.js";

/** The largest seed the shuffle's 32-bit state can hold. */
export const MAX_SEED = 4294967295;

/** Throws an Error with a user-facing message if the Batch configuration is unusable. */
export default function validateBatchConfig({ seed, horizon }: BatchConfig): void {
  if (!Number.isInteger(seed) || seed < 0 || seed > MAX_SEED)
    throw new Error(`seed must be an integer from 0 to ${MAX_SEED}, got ${seed}`);
  if (!Number.isInteger(horizon) || horizon < 1) throw new Error(`horizon must be a positive integer, got ${horizon}`);
}
