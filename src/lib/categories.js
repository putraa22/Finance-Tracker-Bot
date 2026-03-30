export function detectCategory(note) {
  const text = String(note || "").toLowerCase();
  if (text.includes("makan")) return "food";
  if (text.includes("bensin")) return "transport";
  if (text.includes("gaji")) return "salary";
  if (text.includes("kopi")) return "food";
  return "general";
}

export const CATEGORY_LABELS = {
  salary: "Gaji",
  food: "Makan & Kopi",
  transport: "Transport",
  general: "Lainnya",
};

export function getCategoryLabel(category) {
  const key = String(category ?? "").toLowerCase();
  const label = CATEGORY_LABELS[key];
  if (label) return label;
  if (key) return key;
  return CATEGORY_LABELS.general;
}
