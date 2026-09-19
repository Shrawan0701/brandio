import pool from "../config/db.js";

const MONEY_EXPR = `
  CASE
    WHEN COALESCE(deal_type, 'paid') IN ('gifted', 'barter') THEN 0
    WHEN COALESCE(deal_type, 'paid') IN ('affiliate', 'commission') THEN COALESCE(commission_earned, 0)
    WHEN COALESCE(deal_type, 'paid') = 'hybrid' THEN COALESCE(fixed_amount, amount, 0) + COALESCE(commission_earned, 0)
    ELSE COALESCE(amount, 0)
  END
`;

const defaultSettings = {
  tax_reserve_percentage: 20,
  gst_number: "",
  pan_number: "",
  business_name: "",
  tds_tracking_enabled: false,
  invoice_prefix: ""
};

export const normalizeMoneySettings = (value = {}) => {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const pct = Number(source.tax_reserve_percentage);
  return {
    ...defaultSettings,
    ...source,
    tax_reserve_percentage: Number.isFinite(pct) && pct >= 0 ? Math.min(pct, 100) : 20,
    tds_tracking_enabled: source.tds_tracking_enabled === true
  };
};

export const getMoneySettingsDB = async (userId) => {
  const { rows } = await pool.query(
    `SELECT money_settings FROM users WHERE id=$1`,
    [userId]
  );
  return normalizeMoneySettings(rows[0]?.money_settings);
};

export const updateMoneySettingsDB = async (userId, settings) => {
  const next = normalizeMoneySettings(settings);
  const { rows } = await pool.query(
    `UPDATE users SET money_settings=$1 WHERE id=$2 RETURNING money_settings`,
    [next, userId]
  );
  return normalizeMoneySettings(rows[0].money_settings);
};

export const getMoneyCockpitDB = async (userId) => {
  const settings = await getMoneySettingsDB(userId);

  const summary = await pool.query(
    `SELECT
       COALESCE(SUM(${MONEY_EXPR}) FILTER (
         WHERE status='completed'
           AND DATE_TRUNC('month', COALESCE(paid_date, created_at)::date) = DATE_TRUNC('month', CURRENT_DATE)
       ), 0) AS earned_this_month,
       COALESCE(SUM(${MONEY_EXPR}) FILTER (WHERE status IN ('pending','active')), 0) AS pending,
       COALESCE(SUM(${MONEY_EXPR}) FILTER (
         WHERE status='overdue'
           OR (payment_due_date IS NOT NULL AND payment_due_date < CURRENT_DATE AND status <> 'completed')
       ), 0) AS overdue,
       COALESCE(SUM(${MONEY_EXPR}) FILTER (WHERE status <> 'completed'), 0) AS expected,
       COALESCE(SUM(${MONEY_EXPR}) FILTER (WHERE status='completed'), 0) AS paid,
       COALESCE(SUM(expenses) FILTER (WHERE status='completed'), 0) AS recorded_expenses
     FROM deals
     WHERE user_id=$1`,
    [userId]
  );

  const row = summary.rows[0];
  const paid = Number(row.paid);
  const expenses = Number(row.recorded_expenses);
  const reservePct = Number(settings.tax_reserve_percentage) || 0;
  const suggestedReserve = Math.round((paid * reservePct) / 100 * 100) / 100;

  const revenueByMonth = await pool.query(
    `SELECT
       TO_CHAR(DATE_TRUNC('month', COALESCE(paid_date, created_at)::date), 'YYYY-MM') AS key,
       TO_CHAR(DATE_TRUNC('month', COALESCE(paid_date, created_at)::date), 'Mon YYYY') AS label,
       COALESCE(SUM(${MONEY_EXPR}), 0) AS revenue
     FROM deals
     WHERE user_id=$1 AND status='completed'
     GROUP BY 1, 2
     ORDER BY key DESC
     LIMIT 12`,
    [userId]
  );

  const cashFlow = await pool.query(
    `SELECT
       TO_CHAR(DATE_TRUNC('month', payment_due_date), 'YYYY-MM') AS key,
       TO_CHAR(DATE_TRUNC('month', payment_due_date), 'Mon YYYY') AS label,
       COALESCE(SUM(${MONEY_EXPR}), 0) AS expected
     FROM deals
     WHERE user_id=$1
       AND status <> 'completed'
       AND payment_due_date IS NOT NULL
     GROUP BY 1, 2
     ORDER BY key ASC
     LIMIT 6`,
    [userId]
  );

  const byBrand = await grouped(userId, "brand_name", "brand");
  const byPlatform = await grouped(userId, "COALESCE(NULLIF(platform_custom, ''), platform)", "platform");
  const byDealType = await grouped(userId, "COALESCE(deal_type, 'paid')", "deal_type");

  return {
    settings,
    summary: {
      earned_this_month: Number(row.earned_this_month),
      pending: Number(row.pending),
      overdue: Number(row.overdue),
      expected: Number(row.expected),
      paid,
      recorded_expenses: expenses,
      net_earnings: paid - expenses
    },
    taxReserve: {
      percentage: reservePct,
      basis: paid,
      suggested_reserve: suggestedReserve,
      disclaimer: "Planning reserve only. This is not tax advice."
    },
    revenueByMonth: revenueByMonth.rows.map(numRow("revenue")).reverse(),
    expectedCashFlow: cashFlow.rows.map(numRow("expected")),
    revenueByBrand: byBrand,
    revenueByPlatform: byPlatform,
    revenueByDealType: byDealType
  };
};

const numRow = (field) => (row) => ({ ...row, [field]: Number(row[field]) });

const grouped = async (userId, groupExpr, alias) => {
  const { rows } = await pool.query(
    `SELECT
       ${groupExpr} AS ${alias},
       COALESCE(SUM(${MONEY_EXPR}), 0) AS revenue,
       COUNT(*)::int AS deals
     FROM deals
     WHERE user_id=$1 AND status='completed'
     GROUP BY 1
     ORDER BY revenue DESC
     LIMIT 10`,
    [userId]
  );
  return rows.map((row) => ({ ...row, revenue: Number(row.revenue) }));
};
