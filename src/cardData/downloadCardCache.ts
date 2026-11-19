import { createWriteStream, mkdirSync, renameSync } from "node:fs";
import { dirname } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";

export const DEFAULT_CACHE_PATH = "data/cards/oracle-cards.jsonl";

const BULK_DATA_URL = "https://api.scryfall.com/bulk-data/oracle-cards";
// Scryfall asks automated clients to send a descriptive User-Agent and an Accept header.
const HEADERS = { "User-Agent": "mtg-simulator-workflow/0.1", Accept: "application/json" };

export interface BulkDataInfo {
  type: string;
  /** Gzipped JSON Lines: one card object per line. */
  jsonl_download_uri: string;
  updated_at: string;
}

/** Fetches the metadata describing the Oracle Cards bulk file (not the file itself). */
export async function fetchBulkDataInfo(fetchFn: typeof fetch = fetch): Promise<BulkDataInfo> {
  const response = await fetchFn(BULK_DATA_URL, { headers: HEADERS });
  if (!response.ok) throw new Error(`Scryfall bulk-data request failed: ${response.status} ${response.statusText}`);
  return (await response.json()) as BulkDataInfo;
}

/** Downloads the Scryfall Oracle Cards bulk file to `path` (unzipped), replacing any earlier cache. */
export default async function downloadCardCache(path: string = DEFAULT_CACHE_PATH): Promise<void> {
  const info = await fetchBulkDataInfo();
  if (!info.jsonl_download_uri) throw new Error("Scryfall bulk-data response has no jsonl_download_uri");
  const response = await fetch(info.jsonl_download_uri, { headers: HEADERS });
  if (!response.ok || !response.body)
    throw new Error(`Scryfall card download failed: ${response.status} ${response.statusText}`);
  mkdirSync(dirname(path), { recursive: true });
  // Write beside the target then rename, so an interrupted download never leaves a corrupt cache.
  const partial = `${path}.partial`;
  await pipeline(
    Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]),
    createGunzip(),
    createWriteStream(partial),
  );
  renameSync(partial, path);
}
