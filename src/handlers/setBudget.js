import { prisma } from "../db.js";
import { formatRupiah } from "../lib/format.js";
import { replyMd } from "../lib/telegram.js";

export async function handleSetBudget(ctx, user) {
  const parts = String(ctx.message?.text || "").trim().split(/\s+/);
  const category = String(parts[1] || "").trim().toLowerCase();
  const amount = Number.parseFloat(parts[2]);

  if (!category || Number.isNaN(amount)) {
    return replyMd(ctx, "❌ Format: `/setbudget food 1000000`");
  }

  const budget = await prisma.budget.upsert({
    where: {
      userId_category: {
        userId: user.id,
        category,
      },
    },
    update: { limitAmount: amount },
    create: {
      userId: user.id,
      category,
      limitAmount: amount,
    },
    select: {
      category: true,
      limitAmount: true,
    },
  });

  return ctx.reply(`✅ Budget "${budget.category}" diset ${formatRupiah(budget.limitAmount)}`);
}
