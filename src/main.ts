import { runCli } from "./cli/index.js";

try {
  console.log(runCli(process.argv.slice(2)));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
