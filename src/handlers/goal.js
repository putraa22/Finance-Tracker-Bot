import { formatRupiah, progressBar } from "../lib/format.js";
import { goalProgressStatusLabel } from "../lib/goalStatus.js";
import { replyMd } from "../lib/telegram.js";
import {
  getGoalsForUser,
  aggregateNetIncomeForUser,
} from "../services/goals.js";

function buildGoalProgressText({ goals, totalNet }) {
  let text = "🎯 Progress Goal (saldo bersih):\n\n";

  for (const g of goals) {
    const target = g.target || 0;
    const percentNum = target > 0 ? (totalNet / target) * 100 : 0;
    const percentDisplay = Math.round(percentNum);
    const status = goalProgressStatusLabel(percentNum);

    text += `${g.name}\n`;
    text += `${formatRupiah(totalNet)} / ${formatRupiah(target)} (${percentDisplay}%)\n`;
    text += `${progressBar(percentNum)} ${status}\n\n`;
  }

  return text.trimEnd();
}

export async function handleGoal(ctx, user) {
  const goals = await getGoalsForUser(user.id);
  if (goals.length === 0) {
    return replyMd(
      ctx,
      [
        "📭 Belum ada *goal* (tabel khusus `Goal`).",
        "",
        "_Yang muncul di `/budget` (mis. food, nabung) itu dari `/setbudget`, bukan dari `/setgoal`._",
        "",
        "_Goal dihitung dari saldo bersih (pemasukan - pengeluaran) sepanjang waktu._",
        "",
        "Untuk isi `/goal`, pakai contoh:",
        "`/setgoal nabung 10000000`",
      ].join("\n"),
    );
  }

  const totalNet = await aggregateNetIncomeForUser(user.id);
  const text = buildGoalProgressText({ goals, totalNet });

  return ctx.reply(text);
}

