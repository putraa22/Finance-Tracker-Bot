import { formatRupiah } from "../lib/format.js";
import { goalProgressStatusLabel } from "../lib/goalStatus.js";
import { replyMd } from "../lib/telegram.js";
import { getGoalsForUser, aggregateTotalIncomeForUser } from "../services/goals.js";

function buildGoalProgressText({ goals, totalIncome }) {
  let text = "🎯 Progress Goal:\n\n";

  for (const g of goals) {
    const target = g.target || 0;
    const percentNum = target > 0 ? (totalIncome / target) * 100 : 0;
    const percentDisplay = Math.round(percentNum);
    const status = goalProgressStatusLabel(percentNum);

    text += `${g.name}\n`;
    text += `${formatRupiah(totalIncome)} / ${formatRupiah(target)} (${percentDisplay}%)\n`;
    text += `${status}\n\n`;
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
        "Untuk isi `/goal`, pakai contoh:",
        "`/setgoal nabung 10000000`",
      ].join("\n"),
    );
  }

  const totalIncome = await aggregateTotalIncomeForUser(user.id);
  const text = buildGoalProgressText({ goals, totalIncome });

  return ctx.reply(text);
}

