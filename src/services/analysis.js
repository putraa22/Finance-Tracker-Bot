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
    const amt = Number(t.amount) || 0;
    if (dow === 0 || dow === 6) weekend += amt;
    else weekday += amt;
  }

  return { weekday, weekend };
}

export function topExpenseCategory(transactions) {
  const [first] = topExpenseCategories(transactions, 1);
  return first ? [first.category, first.total] : null; // [category, total]
}

export function topExpenseCategories(transactions, limit = 5) {
  const categoryMap = Object.create(null);

  for (const t of transactions) {
    const category = t.category;
    const amt = Number(t.amount) || 0;
    categoryMap[category] = (categoryMap[category] || 0) + amt;
  }

  const total = Object.values(categoryMap).reduce((sum, v) => sum + v, 0) || 0;

  return Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([category, amount]) => ({
      category,
      total: amount,
      percent: total ? Math.round((amount / total) * 100) : 0,
    }));
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

  const currentTotal = transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const { weekday, weekend } = summarizeWeekdayWeekend(transactions);
  const topCategories = topExpenseCategories(transactions, 5);
  const topCategory = topCategories.length
    ? [topCategories[0].category, topCategories[0].total]
    : null;

  const daysInMonth = dayjs(current.start).daysInMonth();
  const avgPerDay = daysInMonth ? currentTotal / daysInMonth : 0;

  const expenseByCategory = Object.create(null);
  for (const t of transactions) {
    const category = t.category;
    expenseByCategory[category] = (expenseByCategory[category] || 0) + (Number(t.amount) || 0);
  }

  const budgets = await prisma.budget.findMany({
    where: { userId },
    select: { category: true, limitAmount: true },
  });

  const budgetTop = budgets
    .map((b) => {
      const limit = Number(b.limitAmount) || 0;
      const used = expenseByCategory[b.category] ?? 0;
      if (!limit || !used) return null;
      return {
        category: b.category,
        used,
        limit,
        percent: Math.round((used / limit) * 100),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 3);

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
    topCategories,
    avgPerDay,
    budgetTop,
    lastTotal,
    diff,
    percent,
  };
}

