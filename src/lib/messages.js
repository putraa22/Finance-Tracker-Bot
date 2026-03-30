import { formatRupiah } from "./format.js";

export function buildSummaryMessage({ title, income, expense, insight }) {
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

export function buildClearHelp() {
  return [
    "🧹 Clear data (hapus dari database)",
    "",
    "Transaksi:",
    "- `/clear today` (hapus transaksi hari ini)",
    "- `/clear month` (hapus transaksi bulan ini)",
    "- `/clear all CONFIRM` (hapus semua transaksi, budget, & goal)",
    "",
    "Budget:",
    "- `/clear budgets CONFIRM` (hapus semua budget)",
    "",
    "Semua data (transaksi + budget + goal):",
    "- `/clear everything CONFIRM`",
  ].join("\n");
}
