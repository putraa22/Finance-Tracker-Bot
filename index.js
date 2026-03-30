import "dotenv/config";

import dayjs from "dayjs";
import { Telegraf, Markup } from "telegraf";
import { message } from "telegraf/filters";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

const BOT_TOKEN = requiredEnv("BOT_TOKEN");
const DATABASE_URL = requiredEnv("DATABASE_URL");

const bot = new Telegraf(BOT_TOKEN);

const pool = new Pool({ connectionString: DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function registerBotCommands() {
  await bot.telegram.setMyCommands([
    { command: "start", description: "Mulai & lihat panduan" },
    { command: "summary", description: "Ringkasan semua transaksi" },
    { command: "today", description: "Transaksi hari ini" },
    { command: "monthly", description: "Ringkasan bulan ini" },
    { command: "setbudget", description: "Set budget per kategori" },
    { command: "budget", description: "Lihat budget bulan ini" },
    { command: "clear", description: "Hapus data (dengan konfirmasi)" },
  ]);

  // Biar tombol menu (≡) selalu muncul di chat bot
  await bot.telegram.setChatMenuButton({
    menu_button: { type: "commands" },
  });
}

function formatRupiah(amount) {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);
}

function detectCategory(note) {
  const text = String(note || "").toLowerCase();
  if (text.includes("makan")) return "food";
  if (text.includes("bensin")) return "transport";
  if (text.includes("gaji")) return "salary";
  if (text.includes("kopi")) return "food";
  return "general";
}

function parseTransactionMessage(text) {
  const raw = String(text || "").trim();
  if (!raw.startsWith("+") && !raw.startsWith("-")) return null;

  const type = raw.startsWith("+") ? "income" : "expense";
  const clean = raw.slice(1).trim();
  const [amountStr, ...noteArr] = clean.split(/\s+/).filter(Boolean);
  const amount = Number.parseFloat(amountStr);
  if (Number.isNaN(amount)) return { error: "FORMAT" };

  const note = noteArr.join(" ").trim();
  const category = detectCategory(note);

  return { type, amount, note, category };
}

function buildSummaryMessage({ title, income, expense, insight }) {
  const saldo = (Number(income) || 0) - (Number(expense) || 0);
  const lines = [
    title,
    "",
    `Income : ${formatRupiah(income)}`,
    `Expense: ${formatRupiah(expense)}`,
    `Saldo  : ${formatRupiah(saldo)}`,
  ];
  if (insight) lines.push(insight);
  return lines.join("\n");
}

function buildClearHelp() {
  return [
    "🧹 Clear data (hapus dari database)",
    "",
    "Transaksi:",
    "- `/clear today` (hapus transaksi hari ini)",
    "- `/clear month` (hapus transaksi bulan ini)",
    "- `/clear all CONFIRM` (hapus semua transaksi)",
    "",
    "Budget:",
    "- `/clear budgets CONFIRM` (hapus semua budget)",
    "",
    "Semua data (transaksi + budget):",
    "- `/clear everything CONFIRM`",
  ].join("\n");
}

async function maybeWarnBudget(ctx, userId, category) {
  const budget = await prisma.budget.findFirst({
    where: {
      userId,
      category,
    },
    select: { limitAmount: true },
  });

  if (!budget) return;

  const start = dayjs().startOf("month").toDate();

  const total = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: {
      userId,
      type: "expense",
      category,
      createdAt: {
        gte: start,
      },
    },
  });

  const used = total._sum.amount ?? 0;
  const limit = budget.limitAmount || 0;
  if (limit <= 0) return;

  const percent = (used / limit) * 100;

  if (percent >= 100) {
    await ctx.reply(`🚨 Budget ${category} HABIS!`);
  } else if (percent >= 80) {
    await ctx.reply(`⚠️ Budget ${category} sudah ${percent.toFixed(0)}%`);
  }
}

// ambil / buat user
async function getUser(ctx) {
  const telegramId = String(ctx.from.id);

  let user = await prisma.user.findUnique({
    where: { telegramId },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        telegramId,
        name: ctx.from.first_name,
      },
    });
  }

  return user;
}

bot.use(async (ctx, next) => {
  try {
    return await next();
  } catch (err) {
    console.error(err);
    return ctx.reply("❌ Terjadi error. Coba lagi ya.");
  }
});

bot.start(async (ctx) => {
  const name = ctx.from?.first_name ? `, ${ctx.from.first_name}` : "";
  const message = [
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
    "*Tips*",
    "- Ketik `/` untuk melihat semua command.",
    "- Gunakan `/clear` untuk hapus data (butuh konfirmasi).",
  ].join("\n");

  const actions = Markup.inlineKeyboard([
    [Markup.button.callback("📊 Ringkasan", "go:summary"), Markup.button.callback("📅 Hari ini", "go:today")],
    [Markup.button.callback("📆 Bulan ini", "go:monthly"), Markup.button.callback("🎯 Budget", "go:budget")],
    [Markup.button.callback("🧹 Clear", "go:clear")],
  ]);

  const keyboard = Markup.keyboard([
    ["/summary", "/today", "/monthly"],
    ["/budget", "/setbudget"],
    ["/clear"],
  ])
    .resize()
    .persistent();

  await ctx.reply(message, { parse_mode: "Markdown", ...actions, ...keyboard });
});

async function handleSummary(ctx) {
  const user = await getUser(ctx);

  const income = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: { userId: user.id, type: "income" },
  });

  const expense = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: { userId: user.id, type: "expense" },
  });

  const totalIncome = income._sum.amount ?? 0;
  const totalExpense = expense._sum.amount ?? 0;

  return ctx.reply(
    buildSummaryMessage({
      title: "📊 Ringkasan",
      income: totalIncome,
      expense: totalExpense,
    }),
  );
}

async function handleToday(ctx) {
  const user = await getUser(ctx);

  const start = dayjs().startOf("day").toDate();
  const end = dayjs().endOf("day").toDate();

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (transactions.length === 0) {
    return ctx.reply("📭 Belum ada transaksi hari ini");
  }

  const lines = ["📅 Transaksi hari ini", ""];
  transactions.forEach((t) => {
    const sign = t.type === "income" ? "+" : "-";
    const note = t.note ? ` ${t.note}` : "";
    lines.push(`${sign}${formatRupiah(t.amount)}${note} (${t.category})`);
  });
  return ctx.reply(lines.join("\n"));
}

async function handleMonthly(ctx) {
  const user = await getUser(ctx);

  const start = dayjs().startOf("month").toDate();
  const end = dayjs().endOf("month").toDate();

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      createdAt: {
        gte: start,
        lte: end,
      },
    },
  });

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const categoryMap = {};

  transactions.forEach((t) => {
    if (t.type === "expense") {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    }
  });

  const topCategory = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0] || null;
  const insight = topCategory ? `💡 Terbesar: ${topCategory[0]} (${formatRupiah(topCategory[1])})` : "";

  return ctx.reply(
    buildSummaryMessage({
      title: "📆 Bulan ini",
      income,
      expense,
      insight,
    }),
  );
}

async function handleBudget(ctx) {
  const user = await getUser(ctx);

  const budgets = await prisma.budget.findMany({
    where: { userId: user.id },
    select: { category: true, limitAmount: true },
    orderBy: { category: "asc" },
  });

  if (budgets.length === 0) {
    return ctx.reply("📭 Belum ada budget. Set dulu pakai: `/setbudget food 1000000`", { parse_mode: "Markdown" });
  }

  const start = dayjs().startOf("month").toDate();

  const expenseByCategory = await prisma.transaction.groupBy({
    by: ["category"],
    _sum: { amount: true },
    where: {
      userId: user.id,
      type: "expense",
      createdAt: { gte: start },
    },
  });

  const usedMap = new Map(expenseByCategory.map((x) => [x.category, x._sum.amount ?? 0]));

  const lines = ["📊 Budget kamu (bulan ini)", ""];
  for (const b of budgets) {
    const used = usedMap.get(b.category) ?? 0;
    const limit = b.limitAmount || 0;
    const percent = limit > 0 ? Math.min(999, Math.round((used / limit) * 100)) : 0;

    lines.push(
      `• ${b.category}`,
      `${formatRupiah(used)} / ${formatRupiah(limit)} (${percent}%)`,
      "",
    );
  }

  return ctx.reply(lines.join("\n").trim());
}

bot.action("go:summary", async (ctx) => {
  await ctx.answerCbQuery();
  return handleSummary(ctx);
});
bot.action("go:today", async (ctx) => {
  await ctx.answerCbQuery();
  return handleToday(ctx);
});
bot.action("go:monthly", async (ctx) => {
  await ctx.answerCbQuery();
  return handleMonthly(ctx);
});
bot.action("go:budget", async (ctx) => {
  await ctx.answerCbQuery();
  return handleBudget(ctx);
});
bot.action("go:clear", async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.reply(buildClearHelp(), { parse_mode: "Markdown" });
});

// input transaksi
bot.on(message("text"), async (ctx, next) => {
  const text = ctx.message.text;

  // jangan ganggu command seperti /summary
  if (text.startsWith("/")) return next();

  const parsed = parseTransactionMessage(text);
  if (!parsed) return;
  if (parsed.error === "FORMAT") return ctx.reply("❌ Format salah. Contoh: `-25000 makan`", { parse_mode: "Markdown" });

  const user = await getUser(ctx);

  await prisma.transaction.create({
    data: {
      userId: user.id,
      type: parsed.type,
      amount: parsed.amount,
      category: parsed.category,
      note: parsed.note,
    },
  });

  const sign = parsed.type === "income" ? "+" : "-";
  const notePart = parsed.note ? ` - ${parsed.note}` : "";
  const message = [
    "✅ Transaksi tersimpan",
    `${sign}${formatRupiah(parsed.amount)}${notePart}`.trim(),
    `Kategori: ${parsed.category}`,
  ].join("\n");
  await ctx.reply(message);

  if (parsed.type === "expense") {
    await maybeWarnBudget(ctx, user.id, parsed.category);
  }
});

// summary
bot.command("summary", handleSummary);

bot.command("today", handleToday);

bot.command("monthly", handleMonthly);

bot.command("setbudget", async (ctx) => {
  const user = await getUser(ctx);

  const text = String(ctx.message?.text || "");
  const parts = text.trim().split(/\s+/);
  const category = String(parts[1] || "").trim().toLowerCase();
  const amount = Number.parseFloat(parts[2]);

  if (!category || Number.isNaN(amount)) {
    return ctx.reply("❌ Format: `/setbudget food 1000000`", { parse_mode: "Markdown" });
  }

  const budget = await prisma.budget.upsert({
    where: {
      userId_category: {
        userId: user.id,
        category,
      },
    },
    update: {
      limitAmount: amount,
    },
    create: {
      userId: user.id,
      category,
      limitAmount: amount,
    },
    select: {
      category: true,
      limitAmount: true,
    },
  });

  return ctx.reply(`✅ Budget "${budget.category}" diset ${formatRupiah(budget.limitAmount)}`);
});

bot.command("budget", handleBudget);

bot.command("clear", async (ctx) => {
  const user = await getUser(ctx);

  const text = String(ctx.message?.text || "").trim();
  const parts = text.split(/\s+/);
  const mode = String(parts[1] || "").toLowerCase();
  const confirm = String(parts[2] || "").toUpperCase() === "CONFIRM";

  if (!mode) {
    return ctx.reply(buildClearHelp(), { parse_mode: "Markdown" });
  }

  const now = dayjs();
  const startOfDay = now.startOf("day").toDate();
  const startOfMonth = now.startOf("month").toDate();

  if (mode === "today") {
    const result = await prisma.transaction.deleteMany({
      where: { userId: user.id, createdAt: { gte: startOfDay } },
    });
    return ctx.reply(`🧹 OK. ${result.count} transaksi hari ini dihapus.`);
  }

  if (mode === "month") {
    const result = await prisma.transaction.deleteMany({
      where: { userId: user.id, createdAt: { gte: startOfMonth } },
    });
    return ctx.reply(`🧹 OK. ${result.count} transaksi bulan ini dihapus.`);
  }

  if (mode === "all") {
    if (!confirm) return ctx.reply("⚠️ Untuk menghapus semua transaksi: `/clear all CONFIRM`", { parse_mode: "Markdown" });
    const result = await prisma.transaction.deleteMany({ where: { userId: user.id } });
    return ctx.reply(`🧹 OK. ${result.count} transaksi dihapus.`);
  }

  if (mode === "budgets") {
    if (!confirm) return ctx.reply("⚠️ Untuk menghapus semua budget: `/clear budgets CONFIRM`", { parse_mode: "Markdown" });
    const result = await prisma.budget.deleteMany({ where: { userId: user.id } });
    return ctx.reply(`🧹 OK. ${result.count} budget dihapus.`);
  }

  if (mode === "everything") {
    if (!confirm) {
      return ctx.reply("⚠️ Untuk menghapus transaksi + budget: `/clear everything CONFIRM`", { parse_mode: "Markdown" });
    }
    const [t, b] = await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { userId: user.id } }),
      prisma.budget.deleteMany({ where: { userId: user.id } }),
    ]);
    return ctx.reply(`🧹 OK. ${t.count} transaksi & ${b.count} budget dihapus.`);
  }

  return ctx.reply(buildClearHelp(), { parse_mode: "Markdown" });
});

async function shutdown(signal) {
  console.log(`Received ${signal}, shutting down...`);
  try {
    await prisma.$disconnect();
  } finally {
    await pool.end().catch(() => {});
    try {
      bot.stop(signal);
    } catch (err) {
      console.error(err);
    }
  }
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

async function start() {
  await registerBotCommands();
  await bot.launch();
  console.log("Bot running...");
}

try {
  await start();
} catch (err) {
  console.error(err);
  process.exitCode = 1;
}
