import dayjs from "dayjs";
import { prisma } from "../db.js";
import { TX_TYPE } from "../constants.js";
import { getCategoryLabel } from "../lib/categories.js";

export async function maybeWarnBudget(ctx, userId, category) {
  const budget = await prisma.budget.findFirst({
    where: { userId, category },
    select: { limitAmount: true },
  });

  if (!budget) return;

  const start = dayjs().startOf("month").toDate();

  const total = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: {
      userId,
      type: TX_TYPE.EXPENSE,
      category,
      createdAt: { gte: start },
    },
  });

  const used = total._sum.amount ?? 0;
  const limit = budget.limitAmount || 0;
  if (limit <= 0) return;

  const percent = (used / limit) * 100;

  if (percent >= 100) {
    await ctx.reply(`🚨 Budget ${getCategoryLabel(category)} HABIS!`);
  } else if (percent >= 80) {
    await ctx.reply(`⚠️ Budget ${getCategoryLabel(category)} sudah ${percent.toFixed(0)}%`);
  }
}
