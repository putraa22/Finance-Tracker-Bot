import { buildClearHelp } from "../lib/messages.js";
import { replyMd } from "../lib/telegram.js";
import { runWithUser } from "../services/user.js";
import { handleSummary } from "./summary.js";
import { handleToday } from "./today.js";
import { handleMonthly } from "./monthly.js";
import { handleBudget } from "./budget.js";
import { handleAnalysis } from "./analysis.js";

export function registerCallbackActions(bot) {
  const map = {
    "go:summary": (ctx) => runWithUser(ctx, handleSummary),
    "go:today": (ctx) => runWithUser(ctx, handleToday),
    "go:monthly": (ctx) => runWithUser(ctx, handleMonthly),
    "go:analysis": (ctx) => runWithUser(ctx, handleAnalysis),
    "go:budget": (ctx) => runWithUser(ctx, handleBudget),
    "go:clear": (ctx) => replyMd(ctx, buildClearHelp()),
  };

  for (const [actionId, fn] of Object.entries(map)) {
    bot.action(actionId, async (ctx) => {
      await ctx.answerCbQuery();
      return fn(ctx);
    });
  }
}
