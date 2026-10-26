/* Intelligence formatting helpers — display only, no invented data. */
export const fmtMoney = (n, currency = "INR") => {
  const v = Number(n);
  const symbol = currency === "USD" || currency === "$" ? "$" : "₹";
  if (!Number.isFinite(v)) return `${symbol}0`;
  return symbol + Math.round(v).toLocaleString("en-IN");
};
export const fmtNum = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return "0";
  if (v >= 1000000) return (v / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (v >= 1000) return (v / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(Math.round(v));
};
export const maxOf = (arr, get) => {
  let m = 0;
  for (const a of arr || []) m = Math.max(m, Number(get(a)) || 0);
  return m || 1;
};
export const barPct = (v, max) => Math.max(3, Math.round((Number(v) / max) * 100));
