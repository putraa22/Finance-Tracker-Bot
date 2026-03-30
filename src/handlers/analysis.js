import { formatRupiah } from "../lib/format.js";
import { analyzeCurrentMonthExpenses } from "../services/analysis.js";

function buildInsight({ weekday, weekend, topCategory, diff, percent }) {
  let insight = "";

  insight += weekend > weekday
    ? "📅 Kamu lebih boros di weekend\n"
    : "📅 Pengeluaran lebih stabil di weekday\n";

  if (topCategory) {
    insight += `💸 Kategori terbesar: ${topCategory[0]}\n`;
  }

  if (diff > 0) {
    insight += `📈 Naik ${Math.abs(percent)}% dibanding bulan lalu\n`;
  } else if (diff < 0) {
    insight += `📉 Turun ${Math.abs(percent)}% dibanding bulan lalu\n`;
  } else {
    insight += "📊 Sama dengan bulan lalu\n";
  }

  return insight.trimEnd();
}

export async function handleAnalysis(ctx, user) {
  const result = await analyzeCurrentMonthExpenses(user.id);
  if (!result.hasData) {
    return ctx.reply("📭 Belum ada data bulan ini");
  }

  const insight = buildInsight(result);
  const {
    weekday,
    weekend,
    currentTotal,
  } = result;

  return ctx.reply(
    [
      "📊 ANALYSIS",
      "",
      `Weekday: ${formatRupiah(weekday)}`,
      `Weekend: ${formatRupiah(weekend)}`,
      "",
      `Total bulan ini: ${formatRupiah(currentTotal)}`,
      "",
      insight,
    ].join("\n"),
  );
}

