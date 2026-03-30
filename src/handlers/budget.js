import dayjs from "dayjs";
import { prisma } from "../db.js";
import { TX_TYPE } from "../constants.js";
import { formatRupiah, budgetPercentUsed } from "../lib/format.js";
import { replyMd } from "../lib/telegram.js";

export async function handleBudget(ctx, user) {
  const budgets = await prisma.budget.findMany({
    where: { userId: user.id },
    select: { category: true, limitAmount: true },
    orderBy: { category: "asc" },
  });

  if (budgets.length === 0) {
    return replyMd(ctx, "📭 Belum ada budget. Set dulu pakai: `/setbudget food 1000000`");
  }

  const start = dayjs().startOf("month").toDate();

  const expenseByCategory = await prisma.transaction.groupBy({
    by: ["category"],
    _sum: { amount: true },
    where: {
      userId: user.id,
      type: TX_TYPE.EXPENSE,
      createdAt: { gte: start },
    },
  });

  const usedMap = new Map(
    expenseByCategory.map((x) => [x.category, x._sum.amount ?? 0]),
  );

  const lines = ["📊 Budget kamu (bulan ini)", ""];
  for (const b of budgets) {
    const used = usedMap.get(b.category) ?? 0;
    const limit = b.limitAmount || 0;
    const percent = budgetPercentUsed(used, limit);

    lines.push(
      `• ${b.category}`,
      `${formatRupiah(used)} / ${formatRupiah(limit)} (${percent}%)`,
      "",
    );
  }

  return ctx.reply(lines.join("\n").trim());
}
