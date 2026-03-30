import { Telegraf } from "telegraf";
import { BOT_TOKEN } from "./config.js";
import { prisma, pool } from "./db.js";
import { registerBotCommands } from "./commands/registerCommands.js";
import { installErrorHandler } from "./middleware/errorHandler.js";
import { installHandlers } from "./handlers/index.js";

export const bot = new Telegraf(BOT_TOKEN);

installErrorHandler(bot);
installHandlers(bot);

export async function launchBot() {
  await registerBotCommands(bot);
  await bot.launch();
  console.log("Bot running...");
}

export async function shutdownBot(signal) {
  console.log(`Received ${signal}, shutting down...`);
  try {
    await prisma.$disconnect();
  } finally {
    await pool.end().catch(() => {});
    try {
      bot.stop(signal);
    } catch (err) {
      console.error(err);
    }
  }
}
