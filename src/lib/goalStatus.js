export function goalProgressStatusLabel(percent) {
  const p = Number(percent) || 0;
  if (p >= 100) return "🥳 Goal tercapai!";
  if (p >= 70) return "🔥 Hampir tercapai!";
  if (p >= 30) return "💪 Lumayan progress";
  return "🚀 Baru mulai";
}
