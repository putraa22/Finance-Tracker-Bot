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

