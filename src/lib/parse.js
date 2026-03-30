import { TX_TYPE } from "../constants.js";
import { detectCategory } from "./categories.js";

export function parseTransactionMessage(text) {
  const raw = String(text || "").trim();
  if (!raw.startsWith("+") && !raw.startsWith("-")) return null;

  const type = raw.startsWith("+") ? TX_TYPE.INCOME : TX_TYPE.EXPENSE;
  const clean = raw.slice(1).trim();
  const [amountStr, ...noteArr] = clean.split(/\s+/).filter(Boolean);
  const amount = Number.parseFloat(amountStr);
  if (!Number.isFinite(amount) || Number.isNaN(amount)) return { error: "FORMAT" };
  if (!Number.isInteger(amount)) return { error: "FORMAT_AMOUNT" };

  const note = noteArr.join(" ").trim();
  const category = detectCategory(note);

  return { type, amount, note, category };
}
