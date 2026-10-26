/* =========================================================
   ROI · shared math + formatting (mirrors backend roi.service).
   Never fabricates: missing inputs -> null -> "Not enough data".
   ========================================================= */
import { totalEarned } from "./deals";

export const toNum = (v) => {
  if (v === null || v === undefined || (typeof v === "string" && !v.trim())) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export const daysBetween = (a, b) => {
  if (!a || !b) return null;
  const d1 = new Date(a);
  const d2 = new Date(b);
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return null;
  return Math.round((d2 - d1) / 86400000);
};

export const computeDealRoi = (deal) => {
  const revenue = toNum(totalEarned(deal));
  const expenses = toNum(deal?.expenses) ?? 0;
  const hours = toNum(deal?.hours_spent);
  const net = revenue === null ? null : revenue - expenses;
  const hourly = net === null || hours === null || hours <= 0 ? null : net / hours;
  return {
    revenue,
    expenses,
    net,
    hours,
    hourly,
    hasEnoughData: revenue !== null,
    hasHourlyData: hourly !== null,
    deliverables: Number(deal?.deliverable_count) || 0,
    revisions: Number(deal?.revision_count) || 0,
    waitDays: daysBetween(deal?.posting_date, deal?.paid_date),
    durationDays: daysBetween(deal?.posting_date, deal?.payment_due_date)
  };
};

export const money = (value, currency) => {
  const n = toNum(value);
  if (n === null) return "—";
  const symbol = currency === "$" ? "$" : "₹";
  return `${symbol}${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
};

export const moneyPerHour = (value, currency) => {
  const n = toNum(value);
  if (n === null) return "Not enough data";
  const symbol = currency === "$" ? "$" : "₹";
  return `${symbol}${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}/hour`;
};

export const fmtDays = (days) => {
  if (days === null || days === undefined) return "Not enough data";
  if (days === 0) return "Same day";
  if (days === 1) return "1 day";
  return `${days} days`;
};
