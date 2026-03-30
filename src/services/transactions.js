import { prisma } from "../db.js";
import { TX_TYPE } from "../constants.js";
import { formatRupiah } from "../lib/format.js";

export async function aggregateIncomeExpenseForUser(userId) {
  const [incomeAgg, expenseAgg] = await Promise.all([
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { userId, type: TX_TYPE.INCOME },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { userId, type: TX_TYPE.EXPENSE },
    }),
  ]);

  return {
    income: incomeAgg._sum.amount ?? 0,
    expense: expenseAgg._sum.amount ?? 0,
  };
}

export async function fetchUserTransactionsInRange(userId, start, end, orderBy) {
  return prisma.transaction.findMany({
    where: {
      userId,
      createdAt: { gte: start, lte: end },
    },
    ...(orderBy ? { orderBy } : {}),
  });
}

export function formatTransactionLine(t) {
  const sign = t.type === TX_TYPE.INCOME ? "+" : "-";
  const note = t.note ? ` ${t.note}` : "";
  return `${sign}${formatRupiah(t.amount)}${note} (${t.category})`;
}

export function monthlyIncomeExpenseAndInsight(transactions) {
  let income = 0;
  let expense = 0;
  const expenseByCategory = Object.create(null);

  for (const t of transactions) {
    if (t.type === TX_TYPE.INCOME) {
      income += t.amount;
    } else if (t.type === TX_TYPE.EXPENSE) {
      expense += t.amount;
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    }
  }

  const topEntry = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1])[0];
  const insight = topEntry ? `💡 Terbesar: ${topEntry[0]} (${formatRupiah(topEntry[1])})` : "";

  return { income, expense, insight };
}
