export function formatRupiah(amount) {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(n);
}

export function budgetPercentUsed(used, limit = 0) {
  if (limit <= 0) return 0;
  return Math.min(999, Math.round((used / limit) * 100));
}
