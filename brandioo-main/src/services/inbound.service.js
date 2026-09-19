import pool from "../config/db.js";
import { getPublicCreatorBySlug } from "./publicProfile.service.js";

const INQUIRY_SELECT = `
  SELECT
    i.id,
    i.user_id,
    i.brand,
    i.contact,
    i.email,
    i.website,
    i.campaign,
    i.campaign_type,
    i.budget,
    i.platform,
    i.deliverables,
    i.deadline::text AS deadline,
    i.usage_requirements,
    i.description,
    i.notes,
    i.status,
    i.converted_deal_id,
    i.created_at,
    i.updated_at
  FROM inbound_inquiries i
`;

export const getPublicCreator = async (username) => {
  return getPublicCreatorBySlug(username);
};

export const getCreatorEmail = async (userId) => {
  const { rows } = await pool.query(
    `SELECT email, username FROM users WHERE id=$1`,
    [userId]
  );
  return rows[0];
};

export const createInquiryDB = async (creatorId, data) => {
  const { rows } = await pool.query(
    `INSERT INTO inbound_inquiries
      (user_id, brand, contact, email, website, campaign, campaign_type,
       budget, platform, deliverables, deadline, usage_requirements,
       description, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'new')
     RETURNING *`,
    [
      creatorId,
      data.brand,
      data.contact,
      data.email,
      data.website || null,
      data.campaign || null,
      data.campaign_type || null,
      data.budget || null,
      data.platform || null,
      data.deliverables || null,
      data.deadline || null,
      data.usage_requirements || null,
      data.description || null
    ]
  );
  return rows[0];
};

export const getInquiriesDB = async (userId, filter) => {
  let query = `${INQUIRY_SELECT} WHERE i.user_id=$1`;
  const params = [userId];

  if (filter === "converted") query += ` AND i.converted_deal_id IS NOT NULL`;
  else if (filter) {
    query += ` AND i.status=$2`;
    params.push(filter);
  }

  query += ` ORDER BY i.created_at DESC`;
  const { rows } = await pool.query(query, params);
  return rows;
};

export const getInquiryStatsDB = async (userId) => {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status='new')::int AS new,
       COUNT(*) FILTER (WHERE status='reviewing')::int AS reviewing,
       COUNT(*) FILTER (WHERE status='negotiating')::int AS negotiating,
       COUNT(*) FILTER (WHERE converted_deal_id IS NOT NULL)::int AS converted
     FROM inbound_inquiries
     WHERE user_id=$1`,
    [userId]
  );
  return rows[0];
};

export const updateInquiryDB = async (userId, inquiryId, data) => {
  const allowed = ["notes", "status", "converted_deal_id"];
  const fields = [];
  const values = [];
  let i = 1;

  for (const key of allowed) {
    if (!(key in data)) continue;
    fields.push(`${key}=$${i}`);
    values.push(data[key]);
    i++;
  }

  if (!fields.length) return null;
  fields.push("updated_at=CURRENT_TIMESTAMP");

  const { rows } = await pool.query(
    `UPDATE inbound_inquiries
     SET ${fields.join(", ")}
     WHERE id=$${i} AND user_id=$${i + 1}
       AND (
         converted_deal_id IS NULL
         OR EXISTS (
           SELECT 1 FROM deals d
           WHERE d.id = converted_deal_id AND d.user_id = $${i + 1}
         )
       )
     RETURNING *`,
    [...values, inquiryId, userId]
  );
  return rows[0];
};
