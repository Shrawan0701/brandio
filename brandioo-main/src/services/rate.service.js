import pool from "../config/db.js";
import { currencySql, normalizeCurrency } from "../utils/currency.js";

const MONEY_EXPR = `
  CASE
    WHEN COALESCE(deal_type, 'paid') IN ('gifted', 'barter') THEN 0
    WHEN COALESCE(deal_type, 'paid') IN ('affiliate', 'commission') THEN COALESCE(commission_earned, 0)
    WHEN COALESCE(deal_type, 'paid') = 'hybrid' THEN COALESCE(fixed_amount, amount, 0) + COALESCE(commission_earned, 0)
    ELSE COALESCE(amount, 0)
  END
`;

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const median = (values) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const roundQuote = (value, currency) => {
  const increment = currency === "USD" ? 5 : 500;
  return Math.max(increment, Math.round(value / increment) * increment);
};

const platformLabel = (deal) => deal.platform_custom || deal.platform || "Other";

const similarity = (input, deal) => {
  let score = 0;
  if (String(platformLabel(deal)).toLowerCase() === String(input.platform || "").toLowerCase()) score += 4;
  if (String(deal.deal_type || "paid").toLowerCase() === String(input.content_type || "").toLowerCase()) score += 1;
  const inputDeliverables = num(input.deliverables);
  const dealDeliverables = num(deal.deliverable_count);
  if (inputDeliverables && dealDeliverables) score += Math.max(0, 3 - Math.abs(inputDeliverables - dealDeliverables));
  if (deal.status === "completed") score += 1;
  return score;
};

const adjustmentFactor = (input) => {
  let factor = 1;
  if (input.usage_rights && input.usage_rights !== "Organic only") factor += 0.1;
  if (input.paid_ad_usage === true) factor += 0.15;
  if (input.exclusivity === true) factor += 0.12;
  if (input.turnaround === "Rush") factor += 0.1;
  if (num(input.average_views) > 0) factor += Math.min(0.18, num(input.average_views) / 1000000);
  if (num(input.engagement_rate) > 0) factor += Math.min(0.12, num(input.engagement_rate) / 100);
  return factor;
};

export const calculateRateDB = async (userId, input) => {
  const currency = normalizeCurrency(input.currency);
  const { rows } = await pool.query(
    `SELECT id, brand_name, platform, platform_custom, status, deal_type,
            deliverable_count, posting_date::text AS posting_date, created_at,
            ${MONEY_EXPR} AS revenue
     FROM deals
     WHERE user_id=$1 AND ${currencySql()}=$2 AND ${MONEY_EXPR} > 0
     ORDER BY created_at DESC`,
    [userId, currency]
  );

  const scored = rows
    .map((deal) => ({
      ...deal,
      revenue: Number(deal.revenue) || 0,
      similarity_score: similarity(input, deal)
    }))
    .filter((deal) => deal.similarity_score > 0)
    .sort((a, b) => b.similarity_score - a.similarity_score || b.revenue - a.revenue);

  const comparables = (scored.length ? scored : rows.map((deal) => ({ ...deal, revenue: Number(deal.revenue) || 0, similarity_score: 0 })))
    .slice(0, 8);

  const values = comparables.map((deal) => Number(deal.revenue)).filter((value) => value > 0);
  const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const med = median(values);
  const highest = values.length ? Math.max(...values) : 0;
  const lowComparable = values.length ? Math.min(...values) : 0;
  const highComparable = values.length ? Math.max(...values) : 0;
  const basis = med || average;
  const factor = adjustmentFactor(input);
  const low = basis ? roundQuote(basis * factor * 0.9, currency) : 0;
  const high = basis ? Math.max(low, roundQuote(basis * factor * 1.12, currency)) : 0;

  return {
    currency,
    input,
    comparable_count: values.length,
    comparables: comparables.map((deal) => ({
      id: deal.id,
      brand_name: deal.brand_name,
      platform: platformLabel(deal),
      revenue: deal.revenue,
      deliverable_count: Number(deal.deliverable_count) || 0,
      posting_date: deal.posting_date,
      similarity_score: deal.similarity_score
    })),
    historical: {
      low: lowComparable,
      high: highComparable,
      average: Math.round(average * 100) / 100,
      median: Math.round(med * 100) / 100,
      highest
    },
    suggested_range: { low, high },
    attributes: {
      usage_rights: input.usage_rights || "Not specified",
      paid_ad_usage: input.paid_ad_usage === true,
      exclusivity: input.exclusivity === true,
      turnaround: input.turnaround || "Standard",
      adjustment_factor: Math.round(factor * 100) / 100
    },
    disclaimer: "Planning estimate based on your recorded Brandio data. This is not an objective market price."
  };
};

export const saveQuoteDB = async (userId, input, result, message) => {
  const { rows } = await pool.query(
    `INSERT INTO rate_quotes (user_id, quote_inputs, quote_result, negotiation_message)
     VALUES ($1,$2,$3,$4)
     RETURNING *`,
    [userId, input, result, message || null]
  );
  return rows[0];
};

export const listQuotesDB = async (userId) => {
  const { rows } = await pool.query(
    `SELECT id, quote_inputs, quote_result, negotiation_message, created_at
     FROM rate_quotes
     WHERE user_id=$1
     ORDER BY created_at DESC
     LIMIT 20`,
    [userId]
  );
  return rows;
};
