import "dotenv/config";

import { launchBot, shutdownBot } from "./src/app.js";

process.once("SIGINT", () => shutdownBot("SIGINT"));
process.once("SIGTERM", () => shutdownBot("SIGTERM"));

try {
  await launchBot();
} catch (err) {
  console.error(err);
  process.exitCode = 1;
}
