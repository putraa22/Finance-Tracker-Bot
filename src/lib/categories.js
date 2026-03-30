export function detectCategory(note) {
  const text = String(note || "").toLowerCase();
  if (text.includes("makan")) return "food";
  if (text.includes("bensin")) return "transport";
  if (text.includes("gaji")) return "salary";
  if (text.includes("kopi")) return "food";
  return "general";
}
