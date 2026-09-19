import pool from "../config/db.js";

/* =========================================================
   CONTRACTS · SERVICE
   One contract per deal. Brand / platform / amount /
   currency are read from `deals` via JOIN — never stored here.
   File storage reuses the Cloudinary signed-upload approach
   (only the URL is persisted).
   ========================================================= */

export const CONTRACT_SELECT = `
  SELECT
    c.id,
    c.deal_id,
    c.title,
    c.status,
    c.signature_status,
    c.file_url,
    c.file_name,
    c.notes,
    c.signed_at::text AS signed_at,
    c.expires_at::text AS expires_at,
    c.created_at,
    c.updated_at,
    d.brand_name,
    d.platform,
    d.platform_custom,
    d.amount,
    d.currency,
    d.status AS deal_status,
    CASE
      WHEN c.status = 'signed' THEN 'signed'
      WHEN c.expires_at IS NOT NULL AND c.expires_at < CURRENT_DATE THEN 'expired'
      WHEN c.status = 'expired' THEN 'expired'
      WHEN c.expires_at IS NOT NULL AND c.expires_at <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
      ELSE 'awaiting_signature'
    END AS expiry_state
  FROM contracts c
  JOIN deals d ON d.id = c.deal_id
`;

/* Safe 'YYYY-MM-DD' string for DATE columns (no timezone drift) */
export const toDateString = (value) => {
  if (!value) return null;
  if (typeof value === "string") {
    const m = value.slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(m) ? m : null;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
};

const FILTERS = ["awaiting_signature", "signed", "expiring_soon", "expired"];

export const getContracts = async (userId, filter) => {
  let query = `SELECT * FROM (${CONTRACT_SELECT} WHERE c.user_id = $1) s`;
  const params = [userId];
  if (FILTERS.includes(filter)) {
    query += ` WHERE s.expiry_state = $2`;
    params.push(filter);
  }
  query += ` ORDER BY s.created_at DESC`;
  const { rows } = await pool.query(query, params);
  return rows;
};

export const getContractById = async (userId, contractId) => {
  const { rows } = await pool.query(
    `SELECT * FROM (${CONTRACT_SELECT} WHERE c.id = $1 AND c.user_id = $2) s`,
    [contractId, userId]
  );
  return rows[0];
};

export const getContractByDeal = async (userId, dealId) => {
  const { rows } = await pool.query(
    `SELECT * FROM (${CONTRACT_SELECT} WHERE c.deal_id = $1 AND c.user_id = $2) s`,
    [dealId, userId]
  );
  return rows[0];
};

export const getContractStats = async (userId) => {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE s.expiry_state = 'awaiting_signature')::int AS awaiting_signature,
       COUNT(*) FILTER (WHERE s.expiry_state = 'signed')::int AS signed,
       COUNT(*) FILTER (WHERE s.expiry_state = 'expiring_soon')::int AS expiring_soon,
       COUNT(*) FILTER (WHERE s.expiry_state = 'expired')::int AS expired
     FROM (${CONTRACT_SELECT} WHERE c.user_id = $1) s`,
    [userId]
  );
  return rows[0];
};

/* The deal a contract attaches to — must belong to the creator */
export const findDealForContract = async (userId, dealId) => {
  const { rows } = await pool.query(
    `SELECT id, brand_name, platform, amount, currency, status
     FROM deals WHERE id = $1 AND user_id = $2`,
    [dealId, userId]
  );
  return rows[0];
};

export const createContractDB = async (userId, dealId, data) => {
  const { rows } = await pool.query(
    `INSERT INTO contracts
       (user_id, deal_id, title, status, signature_status,
        file_url, file_name, notes, signed_at, expires_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (deal_id) DO NOTHING
     RETURNING id`,
    [
      userId, dealId, data.title,
      data.status || "awaiting_signature",
      data.signature_status || "awaiting",
      data.file_url || null, data.file_name || null,
      data.notes || null, data.signed_at || null, data.expires_at || null
    ]
  );
  if (!rows.length) return null; // deal already has a contract
  return getContractById(userId, rows[0].id);
};

/* Only metadata columns are writable here — status/signature move
   through their dedicated transitions below. */
const UPDATABLE_FIELDS = ["title", "file_url", "file_name", "notes", "expires_at"];

export const updateContractDB = async (userId, contractId, data) => {
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
  if (!fields.length) return getContractById(userId, contractId);
  fields.push(`updated_at=CURRENT_TIMESTAMP`);
  const { rows } = await pool.query(
    `UPDATE contracts SET ${fields.join(", ")}
     WHERE id=$${i} AND user_id=$${i + 1} RETURNING id`,
    [...values, contractId, userId]
  );
  if (!rows.length) return null;
  return getContractById(userId, rows[0].id);
};

/* Status transition — keeps signature_status + signed_at in sync.
   NOTE: "signed" is creator-marked tracking only, not e-signature. */
export const setStatusDB = async (userId, contractId, status) => {
  const current = await getContractById(userId, contractId);
  if (!current) return null;
  let signature = current.signature_status;
  let signedAt = current.signed_at;
  if (status === "signed") {
    signature = "signed";
    signedAt = toDateString(new Date());
  } else if (status === "awaiting_signature") {
    if (signature === "signed") signature = "awaiting";
    signedAt = null;
  }
  await pool.query(
    `UPDATE contracts SET status=$1, signature_status=$2, signed_at=$3,
       updated_at=CURRENT_TIMESTAMP
     WHERE id=$4 AND user_id=$5`,
    [status, signature, signedAt, contractId, userId]
  );
  return getContractById(userId, contractId);
};

/* Signature transition — mirrors back onto contract status. */
export const setSignatureDB = async (userId, contractId, signature) => {
  const current = await getContractById(userId, contractId);
  if (!current) return null;
  let status = current.status;
  let signedAt = current.signed_at;
  if (signature === "signed") {
    status = "signed";
    signedAt = toDateString(new Date());
  } else {
    if (status === "signed") status = "awaiting_signature";
    if (signature === "unsigned") signedAt = null;
  }
  await pool.query(
    `UPDATE contracts SET signature_status=$1, status=$2, signed_at=$3,
       updated_at=CURRENT_TIMESTAMP
     WHERE id=$4 AND user_id=$5`,
    [signature, status, signedAt, contractId, userId]
  );
  return getContractById(userId, contractId);
};

export const deleteContractDB = async (userId, contractId) => {
  const { rows } = await pool.query(
    `DELETE FROM contracts WHERE id=$1 AND user_id=$2 RETURNING id`,
    [contractId, userId]
  );
  return rows[0];
};
