import dayjs from "dayjs";
import { prisma } from "../db.js";
import { buildClearHelp } from "../lib/messages.js";
import { replyMd } from "../lib/telegram.js";

const CLEAR_MODES = {
  today: {
    needsConfirm: false,
    run: async (userId) => {
      const start = dayjs().startOf("day").toDate();
      const result = await prisma.transaction.deleteMany({
        where: { userId, createdAt: { gte: start } },
      });
      return `🧹 OK. ${result.count} transaksi hari ini dihapus.`;
    },
  },
  month: {
    needsConfirm: false,
    run: async (userId) => {
      const start = dayjs().startOf("month").toDate();
      const result = await prisma.transaction.deleteMany({
        where: { userId, createdAt: { gte: start } },
      });
      return `🧹 OK. ${result.count} transaksi bulan ini dihapus.`;
    },
  },
  all: {
    needsConfirm: true,
    confirmHint:
      "⚠️ Untuk menghapus semua transaksi + budget + goal: `/clear all CONFIRM`",
    run: async (userId) => {
      const [t, b, g] = await prisma.$transaction([
        prisma.transaction.deleteMany({ where: { userId } }),
        prisma.budget.deleteMany({ where: { userId } }),
        prisma.goal.deleteMany({ where: { userId } }),
      ]);
      return `🧹 OK. ${t.count} transaksi, ${b.count} budget & ${g.count} goal dihapus.`;
    },
  },
  budgets: {
    needsConfirm: true,
    confirmHint: "⚠️ Untuk menghapus semua budget: `/clear budgets CONFIRM`",
    run: async (userId) => {
      const result = await prisma.budget.deleteMany({ where: { userId } });
      return `🧹 OK. ${result.count} budget dihapus.`;
    },
  },
  everything: {
    needsConfirm: true,
    confirmHint:
      "⚠️ Untuk menghapus transaksi + budget + goal: `/clear everything CONFIRM`",
    run: async (userId) => {
      const [t, b, g] = await prisma.$transaction([
        prisma.transaction.deleteMany({ where: { userId } }),
        prisma.budget.deleteMany({ where: { userId } }),
        prisma.goal.deleteMany({ where: { userId } }),
      ]);
      return `🧹 OK. ${t.count} transaksi, ${b.count} budget & ${g.count} goal dihapus.`;
    },
  },
};

export async function handleClear(ctx, user) {
  const parts = String(ctx.message?.text || "").trim().split(/\s+/);
  const mode = String(parts[1] || "").toLowerCase();
  const confirmed = String(parts[2] || "").toUpperCase() === "CONFIRM";

  if (!mode) {
    return replyMd(ctx, buildClearHelp());
  }

  const spec = CLEAR_MODES[mode];
  if (!spec) {
    return replyMd(ctx, buildClearHelp());
  }

  if (spec.needsConfirm && !confirmed) {
    return replyMd(ctx, spec.confirmHint);
  }

  const text = await spec.run(user.id);
  return ctx.reply(text);
}
