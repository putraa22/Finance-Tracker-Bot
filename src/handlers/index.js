import { handleStart } from "./start.js";
import { registerCallbackActions } from "./callbacks.js";
import { registerTransactionTextHandler } from "./transactionText.js";
import { runWithUser } from "../services/user.js";
import { handleClear } from "./clear.js";
import { handleSummary } from "./summary.js";
import { handleToday } from "./today.js";
import { handleMonthly } from "./monthly.js";
import { handleBudget } from "./budget.js";
import { handleSetBudget } from "./setBudget.js";
import { handleSetGoal } from "./setGoal.js";
import { handleGoal } from "./goal.js";
import { handleAnalysis } from "./analysis.js";
import { handleLast } from "./last.js";
import { handleDelete } from "./delete.js";

export function installHandlers(bot) {
  bot.start(handleStart);
  registerCallbackActions(bot);
  registerTransactionTextHandler(bot);

  bot.command("summary", (ctx) => runWithUser(ctx, handleSummary));
  bot.command("today", (ctx) => runWithUser(ctx, handleToday));
  bot.command("monthly", (ctx) => runWithUser(ctx, handleMonthly));
  bot.command("analysis", (ctx) => runWithUser(ctx, handleAnalysis));
  bot.command("setbudget", (ctx) => runWithUser(ctx, handleSetBudget));
  bot.command("setgoal", (ctx) => runWithUser(ctx, handleSetGoal));
  bot.command("goal", (ctx) => runWithUser(ctx, handleGoal));
  bot.command("budget", (ctx) => runWithUser(ctx, handleBudget));
  bot.command("last", (ctx) => runWithUser(ctx, handleLast));
  bot.command("delete", (ctx) => runWithUser(ctx, handleDelete));
  bot.command("clear", (ctx) => runWithUser(ctx, handleClear));
}
