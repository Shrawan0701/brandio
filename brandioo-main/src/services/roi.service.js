import pool from "../config/db.js";
import { normalizeCurrency, pickCurrency } from "../utils/currency.js";

/* =========================================================
   ROI · SERVICE — pure math over deal rows. Never fabricates:
   any metric whose inputs are missing returns null and the
   UI renders "Not enough data".
   ========================================================= */

export const num = (v) => {
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

const totalEarned = (deal) => {
  const type = deal?.deal_type || "paid";
  const fixed = num(deal?.fixed_amount ?? deal?.amount) ?? 0;
  const commission = num(deal?.commission_earned) ?? 0;

  if (type === "gifted" || type === "barter") return 0;
  if (type === "affiliate" || type === "commission") return commission;
  if (type === "hybrid") return fixed + commission;
  return num(deal?.amount);
};

/* Per-deal ROI. hours>0 required for hourly; amount required for net. */
export const computeDealRoi = (deal) => {
  const revenue = num(totalEarned(deal));
  const expenses = num(deal?.expenses) ?? 0;
  const hours = num(deal?.hours_spent);
  const net = revenue === null ? null : revenue - expenses;
  const hourly =
    net === null || hours === null || hours <= 0 ? null : net / hours;
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


const groupSum = (rows, keyFn) => {
  const map = new Map();
  for (const r of rows) {
    const key = keyFn(r);
    if (!key) continue;
    const roi = computeDealRoi(r);
    if (!map.has(key)) {
      map.set(key, {
        name: key, deals: 0, revenue: 0, expenses: 0, hours: 0, hourlyNet: 0,
        currency: r.currency
      });
    }
    const g = map.get(key);
    g.deals += 1;
    if (roi.revenue !== null) g.revenue += roi.revenue;
    g.expenses += roi.expenses;
    if (roi.hourly !== null) {
      g.hours += roi.hours;
      g.hourlyNet += roi.net;
    }
  }
  return [...map.values()]
    .map((g) => ({
      ...g,
      revenue: Math.round(g.revenue * 100) / 100,
      expenses: Math.round(g.expenses * 100) / 100,
      net: Math.round((g.revenue - g.expenses) * 100) / 100,
      hourly: g.hours > 0 ? g.hourlyNet / g.hours : null
    }))
    .sort((a, b) => b.net - a.net);
};

/* Aggregate ROI across completed deals. Hourly averages use only
   deals that actually have hours — never averaged over zeros. */
export const getRoiOverview = async (userId, requestedCurrency) => {
  const { rows } = await pool.query(
    `SELECT id, brand_name, platform, platform_custom, amount, currency,
            deal_type, fixed_amount, commission_earned, total_earned,
            status, posting_date, payment_due_date, paid_date, created_at,
            hours_spent, revision_count, deliverable_count, expenses, roi_notes
     FROM deals WHERE user_id=$1 AND status='completed'`,
    [userId]
  );
  const availableCurrencies = [...new Set(rows.map((deal) => normalizeCurrency(deal.currency)))].sort();
  const currency = pickCurrency(availableCurrencies, requestedCurrency);
  const selectedRows = rows.filter((deal) => normalizeCurrency(deal.currency) === currency);
  const withRoi = selectedRows.map((d) => ({ ...d, roi: computeDealRoi(d) }));
  const earning = withRoi.filter((d) => d.roi.revenue !== null);
  const hourlyDeals = withRoi.filter((d) => d.roi.hourly !== null);
  const revenue = earning.reduce((s, d) => s + d.roi.revenue, 0);
  const expenses = earning.reduce((s, d) => s + d.roi.expenses, 0);
  const hours = hourlyDeals.reduce((s, d) => s + d.roi.hours, 0);
  const hourlyNet = hourlyDeals.reduce((s, d) => s + d.roi.net, 0);
  const net = revenue - expenses;
  const round2 = (n) => Math.round(n * 100) / 100;
  return {
    currency,
    availableCurrencies,
    totals: {
      deals: selectedRows.length,
      withData: earning.length,
      withHourly: hourlyDeals.length,
      revenue: round2(revenue),
      expenses: round2(expenses),
      net: round2(net),
      hours: round2(hours),
      avgHourly: hours > 0 ? hourlyNet / hours : null,
      currency
    },
    top: [...withRoi]
      .filter((d) => d.roi.net !== null)
      .sort((a, b) => b.roi.net - a.roi.net)
      .slice(0, 5),
    byBrand: groupSum(selectedRows, (r) => r.brand_name).slice(0, 8),
    byPlatform: groupSum(selectedRows, (r) => r.platform_custom || r.platform).slice(0, 8),
    scatter: withRoi
      .filter((d) => d.roi.hours !== null && d.roi.hours > 0 && d.roi.revenue !== null)
      .map((d) => ({
        id: d.id, brand: d.brand_name,
        hours: Number(d.roi.hours), revenue: Number(d.roi.revenue),
        net: Number(d.roi.net), currency: d.currency
      }))
            .slice(0, 60),
   timeline: Object.entries(
  withRoi
    .filter((d) => d.roi.revenue !== null && (d.paid_date || d.created_at))
    .reduce((acc, d) => {
      const createdAt = new Date(d.paid_date || d.created_at);

      if (!createdAt || Number.isNaN(createdAt.getTime())) return acc;

      const m = createdAt.toISOString().slice(0, 7);

      if (!m) return acc;

      if (!acc[m]) {
        acc[m] = {
          month: m,
          revenue: 0,
          expenses: 0,
          deals: 0
        };
      }

      acc[m].revenue += d.roi.revenue;
      acc[m].expenses += d.roi.expenses;
      acc[m].deals += 1;

      return acc;
    }, {})
).sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({
  month,
  revenue: Math.round(v.revenue * 100) / 100,
  expenses: Math.round(v.expenses * 100) / 100,
  deals: v.deals
}))
  };
};
