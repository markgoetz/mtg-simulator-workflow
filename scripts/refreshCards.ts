import { downloadCardCache, DEFAULT_CACHE_PATH } from "../src/cardData/index.js";

try {
  await downloadCardCache();
  console.log(`Card cache saved to ${DEFAULT_CACHE_PATH}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
