export async function registerBotCommands(bot) {
  await bot.telegram.setMyCommands([
    { command: "start", description: "Mulai & lihat panduan" },
    { command: "summary", description: "Ringkasan semua transaksi" },
    { command: "today", description: "Transaksi hari ini" },
    { command: "monthly", description: "Ringkasan bulan ini" },
    { command: "analysis", description: "Analisis pengeluaran bulan ini" },
    { command: "setbudget", description: "Set budget per kategori" },
    { command: "setgoal", description: "Set target tabungan / goal" },
    { command: "goal", description: "Lihat progress goal" },
    { command: "budget", description: "Lihat budget bulan ini" },
    { command: "last", description: "Transaksi terakhir" },
    { command: "delete", description: "Hapus transaksi (konfirmasi)" },
    { command: "clear", description: "Hapus data (dengan konfirmasi)" },
  ]);

  await bot.telegram.setChatMenuButton({
    menu_button: { type: "commands" },
  });
}
