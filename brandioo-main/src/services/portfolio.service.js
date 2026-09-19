import pool from "../config/db.js";

/* =========================================================
   PORTFOLIO · SERVICE
   Portfolio items are a thin layer over completed deals.
   Brand / platform / amount / currency / status are always
   read from `deals` via JOIN — never duplicated here.
   ========================================================= */

const PORTFOLIO_SELECT = `
  SELECT
    p.id,
    p.deal_id,
    p.campaign_title,
    p.deliverables,
    p.completion_date::text AS completion_date,
    p.content_url,
    p.thumbnail_url,
    p.metrics,
    p.creator_notes,
    p.is_public,
    p.is_featured,
    p.created_at,
    p.updated_at,
    d.brand_name,
    d.platform,
    d.platform_custom,
    d.amount,
    d.currency,
    d.status,
    d.posting_date::text AS posting_date,
    d.payment_due_date::text AS payment_due_date
  FROM portfolio_items p
  JOIN deals d ON d.id = p.deal_id
`;

/* Safe 'YYYY-MM-DD' string for DATE columns (no timezone drift) */
export const toDateString = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  const d = new Date(value);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getPortfolioItems = async (userId, filter) => {
  let query = `${PORTFOLIO_SELECT} WHERE p.user_id = $1`;

  if (filter === "featured") query += ` AND p.is_featured = TRUE`;
  else if (filter === "public") query += ` AND p.is_public = TRUE`;
  else if (filter === "private") query += ` AND p.is_public = FALSE`;

  query += `
    ORDER BY
      p.is_featured DESC,
      COALESCE(p.completion_date, d.posting_date, d.created_at::date) DESC NULLS LAST,
      p.created_at DESC
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows;
};

export const getPortfolioItem = async (userId, itemId) => {
  const { rows } = await pool.query(
    `${PORTFOLIO_SELECT} WHERE p.id = $1 AND p.user_id = $2`,
    [itemId, userId]
  );
  return rows[0];
};

export const countPortfolioItems = async (userId) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*) FROM portfolio_items WHERE user_id=$1`,
    [userId]
  );
  return Number(rows[0].count);
};

export const getPortfolioStats = async (userId) => {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE is_featured)::int AS featured,
       COUNT(*) FILTER (WHERE is_public)::int AS public_items,
       COALESCE(SUM(
         CASE
           WHEN (metrics->>'views') ~ '^[0-9]+(\\.[0-9]+)?$'
           THEN (metrics->>'views')::numeric
           ELSE 0
         END
       ), 0) AS reach
     FROM portfolio_items
     WHERE user_id=$1`,
    [userId]
  );

  const row = rows[0];
  return {
    total: row.total,
    featured: row.featured,
    public: row.public_items,
    reach: Number(row.reach)
  };
};

/* Completed deals that are not portfolio items yet */
export const getPortfolioCandidates = async (userId) => {
  const { rows } = await pool.query(
    `SELECT
       d.id,
       d.brand_name,
       d.platform,
       d.platform_custom,
       d.amount,
       d.currency,
       d.status,
       d.posting_date::text AS posting_date,
       d.payment_due_date::text AS payment_due_date
     FROM deals d
     LEFT JOIN portfolio_items p
       ON p.deal_id = d.id AND p.user_id = d.user_id
     WHERE d.user_id = $1
       AND d.status = 'completed'
       AND p.id IS NULL
     ORDER BY COALESCE(d.posting_date, d.created_at::date) DESC NULLS LAST`,
    [userId]
  );
  return rows;
};

export const findDealForPortfolio = async (userId, dealId) => {
  const { rows } = await pool.query(
    `SELECT
       id, brand_name, platform, platform_custom, amount, currency,
       status, posting_date::text AS posting_date, payment_due_date::text AS payment_due_date
     FROM deals
     WHERE id=$1 AND user_id=$2`,
    [dealId, userId]
  );
  return rows[0];
};

export const createPortfolioItemDB = async (userId, data) => {
  const { rows } = await pool.query(
    `INSERT INTO portfolio_items
       (user_id, deal_id, campaign_title, deliverables, completion_date,
        content_url, thumbnail_url, metrics, creator_notes, is_public, is_featured)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (user_id, deal_id) DO NOTHING
     RETURNING id`,
    [
      userId,
      data.deal_id,
      data.campaign_title || null,
      data.deliverables || [],
      data.completion_date || null,
      data.content_url || null,
      data.thumbnail_url || null,
      data.metrics || {},
      data.creator_notes || null,
      data.is_public === true,
      data.is_featured === true
    ]
  );

  if (!rows.length) return null; // deal already has a portfolio item
  return getPortfolioItem(userId, rows[0].id);
};

/* Only these columns are ever writable — everything else is derived from deals */
const UPDATABLE_FIELDS = [
  "campaign_title",
  "deliverables",
  "completion_date",
  "content_url",
  "thumbnail_url",
  "metrics",
  "creator_notes",
  "is_public",
  "is_featured"
];

export const updatePortfolioItemDB = async (userId, itemId, data) => {
  const fields = [];
  const values = [];
  let i = 1;

  for (const key of UPDATABLE_FIELDS) {
    if (!(key in data)) continue;
    if (data[key] === undefined) continue;

    fields.push(`${key}=$${i}`);
    values.push(data[key]);
    i++;
  }

  if (!fields.length) return getPortfolioItem(userId, itemId);

  fields.push(`updated_at=CURRENT_TIMESTAMP`);

  const { rows } = await pool.query(
    `UPDATE portfolio_items
     SET ${fields.join(", ")}
     WHERE id=$${i} AND user_id=$${i + 1}
     RETURNING id`,
    [...values, itemId, userId]
  );

  if (!rows.length) return null;
  return getPortfolioItem(userId, rows[0].id);
};

export const setVisibilityDB = async (userId, itemId, isPublic) => {
  const { rows } = await pool.query(
    `UPDATE portfolio_items
     SET is_public=$1, updated_at=CURRENT_TIMESTAMP
     WHERE id=$2 AND user_id=$3
     RETURNING id`,
    [isPublic, itemId, userId]
  );

  if (!rows.length) return null;
  return getPortfolioItem(userId, itemId);
};

export const setFeaturedDB = async (userId, itemId, isFeatured) => {
  const { rows } = await pool.query(
    `UPDATE portfolio_items
     SET is_featured=$1, updated_at=CURRENT_TIMESTAMP
     WHERE id=$2 AND user_id=$3
     RETURNING id`,
    [isFeatured, itemId, userId]
  );

  if (!rows.length) return null;
  return getPortfolioItem(userId, itemId);
};

export const deletePortfolioItemDB = async (userId, itemId) => {
  const { rows } = await pool.query(
    `DELETE FROM portfolio_items WHERE id=$1 AND user_id=$2 RETURNING id`,
    [itemId, userId]
  );
  return rows[0];
};