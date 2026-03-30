import { prisma } from "../db.js";
import { formatRupiah } from "../lib/format.js";
import { replyMd } from "../lib/telegram.js";

function parseSetGoalMessage(text) {
  const parts = String(text || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length < 3) {
    return null;
  }

  const amount = Number.parseFloat(parts.at(-1));
  const name = parts.slice(1, -1).join(" ").trim();

  if (!name || !Number.isFinite(amount) || Number.isNaN(amount)) {
    return null;
  }

  if (!Number.isInteger(amount)) {
    return null;
  }

  return { name, amount };
}

export async function handleSetGoal(ctx, user) {
  const parsed = parseSetGoalMessage(ctx.message?.text);
  if (!parsed) {
    return replyMd(
      ctx,
      "❌ Format: `/setgoal nabung 5000000`\n_Nama bisa beberapa kata; nominal harus angka bulat rupiah dan selalu di akhir._",
    );
  }

  const { name, amount } = parsed;

  const goal = await prisma.goal.upsert({
    where: {
      userId_name: {
        userId: user.id,
        name,
      },
    },
    update: { target: amount },
    create: {
      userId: user.id,
      name,
      target: amount,
    },
    select: {
      name: true,
      target: true,
    },
  });

  return ctx.reply(`🎯 Goal "${goal.name}" diset ${formatRupiah(goal.target)}`);
}
