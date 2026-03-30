import { buildSummaryMessage } from "../lib/messages.js";
import { aggregateIncomeExpenseForUser } from "../services/transactions.js";

export async function handleSummary(ctx, user) {
  const { income, expense } = await aggregateIncomeExpenseForUser(user.id);

  return ctx.reply(
    buildSummaryMessage({
      title: "📊 Ringkasan",
      income,
      expense,
    }),
  );
}
