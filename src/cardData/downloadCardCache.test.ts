import { describe, expect, it } from "vitest";
import { fetchBulkDataInfo } from "./downloadCardCache.js";

// Opt-in: hits the real Scryfall endpoint. Run with `LIVE_SCRYFALL=1 npm test`.
describe.skipIf(!process.env["LIVE_SCRYFALL"])("Scryfall bulk-data endpoint (live)", () => {
  it("still describes the Oracle Cards file with a gzipped JSONL download URI", async () => {
    const info = await fetchBulkDataInfo();

    expect(info.type).toBe("oracle_cards");
    expect(info.jsonl_download_uri).toMatch(/^https:\/\/data\.scryfall\.io\/oracle-cards\/.+\.jsonl\.gz$/);
    expect(Number.isNaN(Date.parse(info.updated_at))).toBe(false);
  });
});
