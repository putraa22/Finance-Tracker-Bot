import dayjs from "dayjs";
import {
  fetchUserTransactionsInRange,
  formatTransactionLine,
} from "../services/transactions.js";

export async function handleToday(ctx, user) {
  const start = dayjs().startOf("day").toDate();
  const end = dayjs().endOf("day").toDate();

  const transactions = await fetchUserTransactionsInRange(user.id, start, end, {
    createdAt: "asc",
  });

  if (transactions.length === 0) {
    return ctx.reply("📭 Belum ada transaksi hari ini");
  }

  const lines = ["📅 Transaksi hari ini", "", ...transactions.map(formatTransactionLine)];
  return ctx.reply(lines.join("\n"));
}
