import pool from "../config/db.js";
import { normalizeCurrency, pickCurrency } from "../utils/currency.js";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const parseDate = (v) => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};
const mKey = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
const mLabel = (key) => {
  const p = key.split("-");
  return MONTHS[Number(p[1]) - 1] + " " + p[0].slice(2);
};
const last6 = () => {
  const now = new Date();
  const out = [];
  for (let i = 5; i >= 0; i--) out.push(mKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  return out;
};
const pname = (d) => ((d.platform_custom && d.platform_custom.trim()) || d.platform || "Unknown");
const metricN = (m, k) => {
  if (!m || typeof m !== "object") return 0;
  const n = Number(m[k]);
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const dealRevenue = (deal) => {
  const type = deal.deal_type || "paid";
  if (["gifted", "barter"].includes(type)) return 0;
  if (["affiliate", "commission"].includes(type)) return num(deal.commission_earned);
  if (type === "hybrid") return num(deal.fixed_amount ?? deal.amount) + num(deal.commission_earned);
  return num(deal.amount);
};
export const getIntelligence = async (userId, requestedCurrency) => {
  const dr = await pool.query("SELECT id, brand_name, platform, platform_custom, amount, fixed_amount, commission_earned, deal_type, currency, status, posting_date::text AS posting_date, payment_due_date::text AS payment_due_date, paid_date::text AS paid_date, created_at FROM deals WHERE user_id = $1", [userId]);
  const availableCurrencies = [...new Set(dr.rows.map((deal) => normalizeCurrency(deal.currency)))].sort();
  const currency = pickCurrency(availableCurrencies, requestedCurrency);
  const money = (n) => (currency === "USD" ? "$" : "₹") + Math.round(n).toLocaleString("en-IN");
  const deals = dr.rows.filter((deal) => normalizeCurrency(deal.currency) === currency);
  const pr = await pool.query("SELECT p.metrics FROM portfolio_items p JOIN deals d ON d.id = p.deal_id WHERE p.user_id = $1", [userId]);
  const completed = deals.filter((d) => d.status === "completed");
  const open = deals.filter((d) => d.status === "pending" || d.status === "active" || d.status === "overdue");
  const cCount = completed.length;
  const aCount = deals.filter((d) => d.status === "pending" || d.status === "active" || d.status === "overdue").length;
  let earned = 0;
  for (const d of completed) earned += dealRevenue(d);
  const avgVal = cCount ? earned / cCount : 0;
  let pendingAmt = 0;
  for (const d of open) pendingAmt += dealRevenue(d);
  const yr = new Date().getFullYear();
  const ytd = completed.filter((d) => {
    const dt = parseDate(d.paid_date) || parseDate(d.created_at);
    return dt && dt.getFullYear() === yr;
  });
  let ytdEarn = 0;
  for (const d of ytd) ytdEarn += dealRevenue(d);
  const avgYr = ytd.length ? ytdEarn / ytd.length : 0;
  const now = new Date();
  const thisMonth = completed.filter((d) => {
    const dt = parseDate(d.paid_date) || parseDate(d.created_at);
    return dt && dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth();
  }).length;
  const keys = last6();
  const rev = {};
  const vol = {};
  const av = {};
  for (const k of keys) { rev[k] = 0; vol[k] = 0; }
  for (const d of completed) {
    const dt = parseDate(d.paid_date) || parseDate(d.created_at);
    if (!dt) continue;
    const k = mKey(dt);
    if (!(k in rev)) continue;
    rev[k] += dealRevenue(d);
    vol[k] += 1;
  }
  for (const k of keys) av[k] = vol[k] ? rev[k] / vol[k] : 0;
  const trend = keys.map((k) => ({ key: k, label: mLabel(k), revenue: Math.round(rev[k]), deals: vol[k] }));
  const avgTrend = keys.map((k) => ({ key: k, label: mLabel(k), value: Math.round(av[k]) }));
  const curr = rev[keys[5]] || 0;
  const prev = rev[keys[4]] || 0;
  const delta = prev > 0 ? ((curr - prev) / prev) * 100 : null;
  const pmap = {};
  for (const d of completed) {
    const p = pname(d);
    if (!pmap[p]) pmap[p] = { platform: p, revenue: 0, deals: 0 };
    pmap[p].revenue += dealRevenue(d);
    pmap[p].deals += 1;
  }
  const plats = Object.values(pmap).sort((a, b) => b.revenue - a.revenue);
  const topP = plats[0] || null;
  const bmap = {};
  for (const d of completed) {
    const b = (d.brand_name && d.brand_name.trim()) || "Unknown";
    if (!bmap[b]) bmap[b] = { brand: b, revenue: 0, deals: 0 };
    bmap[b].revenue += dealRevenue(d);
    bmap[b].deals += 1;
  }

  const brands = Object.values(bmap).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  const topB = brands[0] || null;
  let repeat = 0;
  const bvals = Object.values(bmap);
  for (const b of bvals) if (b.deals > 1) repeat += 1;
  const wins = [];
  for (const d of deals) {
    const da = parseDate(d.posting_date);
    const db = parseDate(d.payment_due_date);
    if (!da || !db) continue;
    const diff = Math.round((db - da) / 86400000);
    if (diff >= 0 && diff <= 365) wins.push(diff);
  }
  const avgPay = wins.length ? Math.round(wins.reduce((x, y) => x + y, 0) / wins.length) : null;
  const t0 = new Date();
  t0.setHours(0, 0, 0, 0);
  const odCount = deals.filter((d) => {
    if (d.status !== "overdue") return false;
    const due = parseDate(d.payment_due_date);
    return !due || due < t0;
  }).length;
  let perf = null;
  if (pr.rows.length) {
    let v = 0;
    let l = 0;
    let t = 0;
    for (const r of pr.rows) {
      const vv = metricN(r.metrics, "views");
      const ll = metricN(r.metrics, "likes");
      if (vv > 0 || ll > 0) t += 1;
      v += vv;
      l += ll;
    }
    if (t > 0) perf = { trackedItems: t, totalViews: v, totalLikes: l };
  }
  let perMonth = null;
  if (cCount >= 2) {
    const ts = completed.map((d) => parseDate(d.paid_date) || parseDate(d.created_at)).filter(Boolean).map((d) => d.getTime()).sort((a, b) => a - b);
    if (ts.length >= 2) {
      const span = Math.max(1, (ts[ts.length - 1] - ts[0]) / (86400000 * 30.44));
      perMonth = cCount / span;
    }
  }
  const insights = [];
  if (ytd.length) insights.push({ id: "avg-year", icon: "avg", tone: "indigo", text: "Your average deal value this year is " + money(avgYr) + " across " + ytd.length + " completed deals." });
  if (topP) insights.push({ id: "platform", icon: "platform", tone: "mint", text: "You earned " + money(topP.revenue) + " from " + topP.platform + " collaborations across " + topP.deals + " deals." });
  if (topB) insights.push({ id: "brand", icon: "brand", tone: "gold", text: "Your highest-value brand relationship is " + topB.brand + " at " + money(topB.revenue) + "." });
  if (avgPay !== null) insights.push({ id: "payment", icon: "payment", tone: "blue", text: "Your average payment window is " + avgPay + " days from posting to due date." });
  if (thisMonth) insights.push({ id: "month", icon: "month", tone: "green", text: "You completed " + thisMonth + " collaborations this month." });
  if (delta !== null) insights.push({ id: "delta", icon: "delta", tone: delta >= 0 ? "green" : "red", text: "Your deal value changed by " + Math.abs(Math.round(delta)) + "% compared with the previous month." });
  if (pendingAmt > 0) insights.push({ id: "pending", icon: "pending", tone: "amber", text: money(pendingAmt) + " is currently pending across " + open.length + " open deals." });
  return {
    currency,
    availableCurrencies,
    totals: { totalDeals: deals.length, completedCount: cCount, activeCount: aCount, overdueCount: odCount, totalEarned: earned, avgDealValue: avgVal, pendingAmount: pendingAmt, avgThisYear: avgYr, ytdCount: ytd.length, year: yr, completedThisMonth: thisMonth, avgPaymentDays: avgPay, revenueDeltaPctRounded: delta !== null ? Math.round(delta) : null, dealsPerMonth: perMonth, repeatBrands: repeat },
    revenueTrend: trend,
    avgTrend: avgTrend,
    platformRevenue: plats,
    brandRevenue: brands,
    statusSplit: [{ label: "Completed", value: cCount }, { label: "Active", value: aCount }, { label: "Overdue", value: odCount }],
    performance: perf,
    insights: insights
  };
};
