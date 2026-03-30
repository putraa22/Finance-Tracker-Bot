import { Markup } from "telegraf";

export async function handleStart(ctx) {
  const name = ctx.from?.first_name ? `, ${ctx.from.first_name}` : "";
  const welcomeText = [
    `💼 *Finance Tracker Bot*${name}`,
    "_Catat pemasukan & pengeluaran dengan cepat, rapi, dan terstruktur._",
    "",
    "*Quick actions*",
    "Pilih menu di bawah atau ketik command:",
    "",
    "*Cara pakai (1 baris)*",
    "`+50000 gaji`  •  `-25000 makan`",
    "",
    "*Kategori otomatis*",
    "- `salary` (gaji)",
    "- `food` (makan, kopi)",
    "- `transport` (bensin)",
    "- `general` (lainnya)",
    "",
    "*Budget*",
    "- Set: `/setbudget food 1000000`",
    "- Cek: `/budget`",
    "",
    "*Goal*",
    "- Set: `/setgoal nabung 5000000` (nominal di akhir; nama bisa lebih dari satu kata)",
    "- Cek: `/goal`",
    "",
    "*Analysis*",
    "- `/analysis` (pengeluaran weekday vs weekend & kategori terbesar)",
    "",
    "*Tips*",
    "- Ketik `/` untuk melihat semua command.",
    "- Gunakan `/clear` untuk hapus data (butuh konfirmasi).",
  ].join("\n");

  const actions = Markup.inlineKeyboard([
    [
      Markup.button.callback("📊 Ringkasan", "go:summary"),
      Markup.button.callback("📅 Hari ini", "go:today"),
    ],
    [
      Markup.button.callback("📆 Bulan ini", "go:monthly"),
      Markup.button.callback("📈 Analysis", "go:analysis"),
    ],
    [
      Markup.button.callback("🎯 Budget", "go:budget"),
      Markup.button.callback("🧹 Clear", "go:clear"),
    ],
  ]);

  const keyboard = Markup.keyboard([
    ["/summary", "/today", "/monthly", "/analysis"],
    ["/budget", "/setbudget", "/setgoal", "/goal"],
    ["/clear"],
  ])
    .resize()
    .persistent();

  await ctx.reply(welcomeText, { parse_mode: "Markdown", ...actions });
}
