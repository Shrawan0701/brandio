import pool from "../config/db.js";

const numberOrDefault = (value, fallback = 0) => {
  if (value === "" || value === undefined || value === null) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const textOrNull = (value) => (value === "" || value === undefined ? null : value);

/* Count current deals. Lifetime free usage is stored on users.deal_creations_used. */
export const countTotalDeals = async (userId) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*) FROM deals WHERE user_id=$1`,
    [userId]
  );
  return Number(rows[0].count);
};

export const reserveDealCreation = async (userId) => {
  const { rows } = await pool.query(
    `UPDATE users
     SET deal_creations_used = deal_creations_used + 1
     WHERE id=$1
       AND (plan <> 'free' OR deal_creations_used < 3)
     RETURNING email, plan, deal_creations_used`,
    [userId]
  );
  return rows[0] || null;
};

export const releaseDealCreation = async (userId) => {
  await pool.query(
    `UPDATE users
     SET deal_creations_used = GREATEST(deal_creations_used - 1, 0)
     WHERE id=$1`,
    [userId]
  );
};

export const createDealDB = async (userId, data) => {
  const {
    brand_name,
    platform,
    platform_custom,
    amount,
    currency,
    status,
    posting_date,
    payment_due_date,
    hours_spent,
    revision_count,
    deliverable_count,
    expenses,
    paid_date,
    roi_notes,
    deal_type,
    product_name,
    product_value,
    received_date,
    deliverables,
    expected_content_date,
    shipping_tracking,
    notes,
    fixed_amount,
    commission_percentage,
    commission_earned,
    total_earned
  } = data;

  const { rows } = await pool.query(
    `INSERT INTO deals
     (user_id, brand_name, platform, platform_custom, amount, currency, status, posting_date, payment_due_date,
      hours_spent, revision_count, deliverable_count, expenses, paid_date, roi_notes,
      deal_type, product_name, product_value, received_date, deliverables, expected_content_date,
      shipping_tracking, notes, fixed_amount, commission_percentage, commission_earned, total_earned)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)
     RETURNING *`,
    [
      userId,
      brand_name,
      platform,
      platform_custom || null,
      numberOrDefault(amount),
      currency,
      status || "pending",
      posting_date || null,
      payment_due_date || null,
      hours_spent ?? null,
      revision_count ?? 0,
      deliverable_count ?? 0,
      expenses ?? 0,
      paid_date || null,
      roi_notes || null,
      deal_type || "paid",
      textOrNull(product_name),
      numberOrDefault(product_value),
      received_date || null,
      textOrNull(deliverables),
      expected_content_date || null,
      textOrNull(shipping_tracking),
      textOrNull(notes),
      numberOrDefault(fixed_amount, numberOrDefault(amount)),
      numberOrDefault(commission_percentage),
      numberOrDefault(commission_earned),
      numberOrDefault(total_earned, numberOrDefault(amount))
    ]
  );

  return rows[0];
};

export const getDealsDB = async (userId, filter) => {
  let query = `SELECT * FROM deals WHERE user_id=$1`;
  const params = [userId];

  if (filter === "completed") query += ` AND status='completed'`;
  else if (filter === "overdue") query += ` AND status='overdue'`;
  else if (filter === "active") query += ` AND status IN ('pending','active')`;

  query += ` ORDER BY created_at DESC`;

  const { rows } = await pool.query(query, params);
  return rows;
};

export const getDealDB = async (userId, dealId) => {
  const { rows } = await pool.query(
    `SELECT * FROM deals WHERE id=$1 AND user_id=$2`,
    [dealId, userId]
  );
  return rows[0];
};

export const updateDealDB = async (userId, dealId, data) => {
  const fields = [];
  const values = [];
  let i = 1;

  /* Whitelist — never interpolate raw client keys into SQL. */
  const ALLOWED = new Set([
    "brand_name",
    "platform",
    "platform_custom",
    "amount",
    "currency",
    "status",
    "posting_date",
    "payment_due_date",
    "proof_images",
    "hours_spent",
    "revision_count",
    "deliverable_count",
    "expenses",
    "paid_date",
    "roi_notes",
    "deal_type",
    "product_name",
    "product_value",
    "received_date",
    "deliverables",
    "expected_content_date",
    "shipping_tracking",
    "notes",
    "fixed_amount",
    "commission_percentage",
    "commission_earned",
    "total_earned"
  ]);

  for (const key in data) {
    if (!ALLOWED.has(key)) continue;
    const value = data[key];

    // 🚫 Ignore undefined, null, empty string
    if (value === undefined || value === null || value === "") {
      continue;
    }

    fields.push(`${key}=$${i}`);
    values.push(value);
    i++;
  }

  if (!fields.length) return null;

  const query = `
    UPDATE deals
    SET ${fields.join(",")}
    WHERE id=$${i} AND user_id=$${i + 1}
    RETURNING *
  `;

  const { rows } = await pool.query(query, [
    ...values,
    dealId,
    userId
  ]);

  return rows[0];
};

export const deleteDealDB = async (userId, dealId) => {
  await pool.query(
    `DELETE FROM deals WHERE id=$1 AND user_id=$2`,
    [dealId, userId]
  );
};
