import { prisma } from "../db.js";
import { TX_TYPE } from "../constants.js";

export async function getGoalsForUser(userId) {
  return prisma.goal.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}

export async function aggregateTotalIncomeForUser(userId) {
  const income = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: { userId, type: TX_TYPE.INCOME },
  });

  return income._sum.amount ?? 0;
}

// "Tabungan" untuk Goal dihitung sebagai saldo bersih:
// total pemasukan - total pengeluaran (sepanjang waktu).
export async function aggregateNetIncomeForUser(userId) {
  const [income, expense] = await Promise.all([
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { userId, type: TX_TYPE.INCOME },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { userId, type: TX_TYPE.EXPENSE },
    }),
  ]);

  return (income._sum.amount ?? 0) - (expense._sum.amount ?? 0);
}

