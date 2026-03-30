import dayjs from "dayjs";
import { prisma } from "../db.js";
import { TX_TYPE } from "../constants.js";

function getMonthRange(offsetMonths = 0) {
  const base = dayjs().add(offsetMonths, "month");
  return {
    start: base.startOf("month").toDate(),
    end: base.endOf("month").toDate(),
  };
}

export async function fetchExpenseTransactionsForMonth(userId, { start, end }) {
  return prisma.transaction.findMany({
    where: {
      userId,
      type: TX_TYPE.EXPENSE,
      createdAt: { gte: start, lte: end },
    },
  });
}

export function summarizeWeekdayWeekend(transactions) {
  let weekday = 0;
  let weekend = 0;

  for (const t of transactions) {
    // day(): 0 = Sunday, 6 = Saturday
    const dow = dayjs(t.createdAt).day();
    if (dow === 0 || dow === 6) weekend += t.amount;
    else weekday += t.amount;
  }

  return { weekday, weekend };
}

export function topExpenseCategory(transactions) {
  const categoryMap = Object.create(null);

  for (const t of transactions) {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
  }

  const entry = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0];
  return entry || null; // [category, total]
}

export async function aggregateExpenseSum(userId, { start, end }) {
  const total = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: {
      userId,
      type: TX_TYPE.EXPENSE,
      createdAt: { gte: start, lte: end },
    },
  });

  return total._sum.amount ?? 0;
}

export async function analyzeCurrentMonthExpenses(userId) {
  const current = getMonthRange(0);
  const lastMonth = getMonthRange(-1);

  const transactions = await fetchExpenseTransactionsForMonth(userId, current);
  if (transactions.length === 0) {
    return { hasData: false };
  }

  const currentTotal = transactions.reduce((sum, t) => sum + t.amount, 0);
  const { weekday, weekend } = summarizeWeekdayWeekend(transactions);
  const topCategory = topExpenseCategory(transactions);

  const lastTotal = await aggregateExpenseSum(userId, lastMonth);
  const diff = currentTotal - lastTotal;
  const percent = lastTotal ? Math.round((diff / lastTotal) * 100) : 0;

  return {
    hasData: true,
    transactionsCount: transactions.length,
    currentTotal,
    weekday,
    weekend,
    topCategory,
    lastTotal,
    diff,
    percent,
  };
}

