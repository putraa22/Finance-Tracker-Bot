import dayjs from "dayjs";
import { buildSummaryMessage } from "../lib/messages.js";
import {
  fetchUserTransactionsInRange,
  monthlyIncomeExpenseAndInsight,
} from "../services/transactions.js";

export async function handleMonthly(ctx, user) {
  const start = dayjs().startOf("month").toDate();
  const end = dayjs().endOf("month").toDate();

  const transactions = await fetchUserTransactionsInRange(user.id, start, end);
  const { income, expense, insight } = monthlyIncomeExpenseAndInsight(transactions);

  return ctx.reply(
    buildSummaryMessage({
      title: "📆 Bulan ini",
      income,
      expense,
      insight,
    }),
  );
}
