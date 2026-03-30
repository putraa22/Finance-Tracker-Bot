import dayjs from "dayjs";
import { prisma } from "../db.js";
import { formatTransactionLine } from "../services/transactions.js";

export async function handleLast(ctx, user) {
  const parts = String(ctx.message?.text || "").trim().split(/\s+/).filter(Boolean);
  const requested = Number.parseInt(parts[1], 10);
  const limit = Number.isFinite(requested) ? Math.min(20, Math.max(1, requested)) : 5;

  const txs = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  if (txs.length === 0) {
    return ctx.reply("📭 Belum ada transaksi");
  }

  const lines = [
    `🕒 Transaksi terakhir (showing ${txs.length})`,
    "",
    ...txs.map(
      (t) =>
        `${formatTransactionLine(t)} | ${dayjs(t.createdAt).format("DD MMM HH:mm")}`,
    ),
  ];

  return ctx.reply(lines.join("\n"));
}

