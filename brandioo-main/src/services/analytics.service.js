import pool from "../config/db.js";
import { currencySql, pickCurrency } from "../utils/currency.js";

export const getAnalytics = async (userId, requestedCurrency) => {
  const { rows: currencies } = await pool.query(`SELECT DISTINCT ${currencySql()} AS currency FROM deals WHERE user_id=$1 ORDER BY currency`, [userId]);
  const availableCurrencies = currencies.map((row) => row.currency);
  const currency = pickCurrency(availableCurrencies, requestedCurrency);
  const total = await pool.query(
    `SELECT COALESCE(SUM(
       CASE
         WHEN COALESCE(deal_type, 'paid') IN ('gifted', 'barter') THEN 0
         WHEN COALESCE(deal_type, 'paid') IN ('affiliate', 'commission') THEN COALESCE(commission_earned, 0)
         WHEN COALESCE(deal_type, 'paid') = 'hybrid' THEN COALESCE(fixed_amount, amount, 0) + COALESCE(commission_earned, 0)
         ELSE COALESCE(amount, 0)
       END
     ),0) AS total
     FROM deals
     WHERE user_id=$1 AND ${currencySql()}=$2 AND status='completed'`,
    [userId, currency]
  );

  const pending = await pool.query(
    `SELECT COALESCE(SUM(
       CASE
         WHEN COALESCE(deal_type, 'paid') IN ('gifted', 'barter') THEN 0
         WHEN COALESCE(deal_type, 'paid') IN ('affiliate', 'commission') THEN COALESCE(commission_earned, 0)
         WHEN COALESCE(deal_type, 'paid') = 'hybrid' THEN COALESCE(fixed_amount, amount, 0) + COALESCE(commission_earned, 0)
         ELSE COALESCE(amount, 0)
       END
     ),0) AS pending
     FROM deals
     WHERE user_id=$1 AND ${currencySql()}=$2 AND status IN ('pending','active','overdue')`,
    [userId, currency]
  );

  const thisMonth = await pool.query(
    `SELECT COALESCE(SUM(
       CASE
         WHEN COALESCE(deal_type, 'paid') IN ('gifted', 'barter') THEN 0
         WHEN COALESCE(deal_type, 'paid') IN ('affiliate', 'commission') THEN COALESCE(commission_earned, 0)
         WHEN COALESCE(deal_type, 'paid') = 'hybrid' THEN COALESCE(fixed_amount, amount, 0) + COALESCE(commission_earned, 0)
         ELSE COALESCE(amount, 0)
       END
     ),0) AS month
     FROM deals
     WHERE user_id=$1 AND ${currencySql()}=$2
       AND status='completed'
       AND DATE_TRUNC('month', COALESCE(paid_date, created_at)::date) = DATE_TRUNC('month', CURRENT_DATE)`,
    [userId, currency]
  );

  const counts = await pool.query(
    `SELECT
       COUNT(*) AS total_deals,
       COUNT(*) FILTER (WHERE status='completed') AS completed,
       COUNT(*) FILTER (WHERE status='pending') AS pending
     FROM deals
     WHERE user_id=$1`,
    [userId]
  );

  return {
    currency,
    availableCurrencies,
    totalEarned: Number(total.rows[0].total),
    pendingAmount: Number(pending.rows[0].pending),
    thisMonth: Number(thisMonth.rows[0].month),
    counts: counts.rows[0]
  };
};

export const getDealsForCSV = async (userId) => {
  const { rows } = await pool.query(
    `SELECT
      brand_name,
      platform,
      deal_type,
      amount,
      product_name,
      product_value,
      fixed_amount,
      commission_percentage,
      commission_earned,
      total_earned,
      currency,
      status,
      posting_date,
      payment_due_date,
      created_at
     FROM deals
     WHERE user_id=$1
     ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
};
