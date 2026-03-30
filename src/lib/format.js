export function formatRupiah(amount) {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(n);
}

export function budgetPercentUsed(used, limit = 0) {
  const u = Number(used) || 0;
  const l = Number(limit) || 0;
  if (l <= 0) return 0;
  return Math.min(999, Math.round((u / l) * 100));
}

// Text-based progress bar for Telegram.
// percent is allowed to be >100; it will be capped visually at 100%.
export function progressBar(percent, width = 10) {
  const p = Number(percent) || 0;
  const capped = Math.max(0, Math.min(100, p));
  const filled = Math.round((capped / 100) * width);
  const empty = width - filled;
  return `[${"█".repeat(filled)}${"░".repeat(empty)}]`;
}
