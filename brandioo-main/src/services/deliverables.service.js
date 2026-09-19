import pool from "../config/db.js";

const SELECT = `
  SELECT
    dl.id,
    dl.deal_id,
    dl.title,
    dl.type,
    dl.platform,
    dl.description,
    dl.due_date::text AS due_date,
    dl.status,
    dl.submission_date::text AS submission_date,
    dl.approval_date::text AS approval_date,
    dl.content_url,
    dl.notes,
    dl.revision_count,
    dl.created_at,
    dl.updated_at,
    d.brand_name,
    d.status AS deal_status
  FROM deliverables dl
  JOIN deals d ON d.id = dl.deal_id
`;

export const STATUSES = [
  "not_started",
  "in_progress",
  "submitted",
  "changes_requested",
  "approved",
  "published",
  "completed"
];

export const getDeliverablesDB = async (userId, filter) => {
  let query = `${SELECT} WHERE dl.user_id=$1`;
  const params = [userId];

  if (filter === "today") query += ` AND dl.due_date = CURRENT_DATE`;
  else if (filter === "week") query += ` AND dl.due_date >= CURRENT_DATE AND dl.due_date < CURRENT_DATE + INTERVAL '7 days'`;
  else if (filter === "overdue") query += ` AND dl.due_date < CURRENT_DATE AND dl.status NOT IN ('approved','published','completed')`;
  else if (filter === "awaiting_approval") query += ` AND dl.status IN ('submitted','changes_requested')`;
  else if (filter === "completed") query += ` AND dl.status IN ('approved','published','completed')`;

  query += ` ORDER BY dl.due_date ASC NULLS LAST, dl.created_at DESC`;
  const { rows } = await pool.query(query, params);
  return rows;
};

export const getDealDeliverablesDB = async (userId, dealId) => {
  const { rows } = await pool.query(
    `${SELECT} WHERE dl.user_id=$1 AND dl.deal_id=$2 ORDER BY dl.due_date ASC NULLS LAST, dl.created_at ASC`,
    [userId, dealId]
  );
  return rows;
};

export const getDeliverableStatsDB = async (userId) => {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE due_date = CURRENT_DATE)::int AS due_today,
       COUNT(*) FILTER (WHERE due_date >= CURRENT_DATE AND due_date < CURRENT_DATE + INTERVAL '7 days')::int AS due_this_week,
       COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status NOT IN ('approved','published','completed'))::int AS overdue,
       COUNT(*) FILTER (WHERE status IN ('submitted','changes_requested'))::int AS awaiting_approval,
       COUNT(*) FILTER (WHERE status IN ('approved','published','completed'))::int AS completed,
       COUNT(*)::int AS total
     FROM deliverables
     WHERE user_id=$1`,
    [userId]
  );
  return rows[0];
};

export const createDeliverableDB = async (userId, dealId, data) => {
  const { rows } = await pool.query(
    `INSERT INTO deliverables
      (user_id, deal_id, title, type, platform, description, due_date, status,
       submission_date, approval_date, content_url, notes, revision_count)
     SELECT $1, d.id, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
     FROM deals d
     WHERE d.id=$2 AND d.user_id=$1
     RETURNING id`,
    [
      userId,
      dealId,
      data.title,
      data.type || null,
      data.platform || null,
      data.description || null,
      data.due_date || null,
      data.status || "not_started",
      data.submission_date || null,
      data.approval_date || null,
      data.content_url || null,
      data.notes || null,
      data.revision_count ?? 0
    ]
  );
  if (!rows.length) return null;
  return getDeliverableByIdDB(userId, rows[0].id);
};

export const getDeliverableByIdDB = async (userId, id) => {
  const { rows } = await pool.query(`${SELECT} WHERE dl.user_id=$1 AND dl.id=$2`, [userId, id]);
  return rows[0];
};

export const updateDeliverableDB = async (userId, id, data) => {
  const allowed = [
    "title",
    "type",
    "platform",
    "description",
    "due_date",
    "status",
    "submission_date",
    "approval_date",
    "content_url",
    "notes",
    "revision_count"
  ];
  const fields = [];
  const values = [];
  let i = 1;
  for (const key of allowed) {
    if (!(key in data)) continue;
    fields.push(`${key}=$${i}`);
    values.push(data[key]);
    i++;
  }
  if (!fields.length) return getDeliverableByIdDB(userId, id);
  fields.push("updated_at=CURRENT_TIMESTAMP");
  const { rows } = await pool.query(
    `UPDATE deliverables SET ${fields.join(", ")}
     WHERE id=$${i} AND user_id=$${i + 1}
     RETURNING id`,
    [...values, id, userId]
  );
  if (!rows.length) return null;
  return getDeliverableByIdDB(userId, id);
};

export const deleteDeliverableDB = async (userId, id) => {
  const { rows } = await pool.query(
    `DELETE FROM deliverables WHERE id=$1 AND user_id=$2 RETURNING id`,
    [id, userId]
  );
  return rows[0];
};
