import { message } from "telegraf/filters";
import { prisma } from "../db.js";
import { TX_TYPE } from "../constants.js";
import { parseTransactionMessage } from "../lib/parse.js";
import { formatRupiah } from "../lib/format.js";
import { replyMd } from "../lib/telegram.js";
import { runWithUser } from "../services/user.js";
import { maybeWarnBudget } from "../services/budgetAlerts.js";
import { getCategoryLabel } from "../lib/categories.js";

export function registerTransactionTextHandler(bot) {
  bot.on(message("text"), async (ctx, next) => {
    const text = ctx.message.text;

    if (text.startsWith("/")) return next();

    const parsed = parseTransactionMessage(text);
    if (!parsed) return;
    if (parsed.error === "FORMAT") {
      return replyMd(ctx, "❌ Format salah. Contoh: `-25000 makan`");
    }
    if (parsed.error === "FORMAT_AMOUNT") {
      return replyMd(
        ctx,
        "❌ Nominal harus angka bulat (rupiah). Contoh: `-25000 makan`",
      );
    }

    return runWithUser(ctx, async (innerCtx, user) => {
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: parsed.type,
          amount: parsed.amount,
          category: parsed.category,
          note: parsed.note,
        },
      });

      const sign = parsed.type === TX_TYPE.INCOME ? "+" : "-";
      const notePart = parsed.note ? ` - ${parsed.note}` : "";
      const savedText = [
        "✅ Transaksi tersimpan",
        `${sign}${formatRupiah(parsed.amount)}${notePart}`.trim(),
        `Kategori: ${getCategoryLabel(parsed.category)} (${parsed.category})`,
      ].join("\n");
      await innerCtx.reply(savedText);

      if (parsed.type === TX_TYPE.EXPENSE) {
        await maybeWarnBudget(innerCtx, user.id, parsed.category);
      }
    });
  });
}
