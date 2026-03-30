import { prisma } from "../db.js";
import { replyMd } from "../lib/telegram.js";

export async function handleDelete(ctx, user) {
  const parts = String(ctx.message?.text || "").trim().split(/\s+/).filter(Boolean);
  const id = Number.parseInt(parts[1], 10);
  const confirmed = String(parts[2] || "").toUpperCase() === "CONFIRM";

  if (!Number.isFinite(id)) {
    return replyMd(ctx, "❌ Format: `/delete <id> CONFIRM`");
  }

  if (!confirmed) {
    return replyMd(ctx, `⚠️ Konfirmasi dulu: ketik \`/delete ${id} CONFIRM\``);
  }

  const result = await prisma.transaction.deleteMany({
    where: { userId: user.id, id },
  });

  if (result.count === 0) {
    return ctx.reply(`❌ Tidak ada transaksi untuk id ${id}.`);
  }

  return ctx.reply(`🗑️ OK. ${result.count} transaksi terhapus (id: ${id}).`);
}

