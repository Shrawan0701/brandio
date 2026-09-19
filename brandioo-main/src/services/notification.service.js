import pool from "../config/db.js";

const toText = (value, max = 500) => String(value || "").trim().slice(0, max);

const publicNotificationFields = `
  id,
  type,
  title,
  message,
  entity_type,
  entity_id,
  action_url,
  read_at,
  created_at
`;

export const createNotificationOnce = async ({
  userId,
  eventKey,
  type,
  title,
  message,
  entityType = null,
  entityId = null,
  actionUrl = null,
  metadata = {}
}) => {
  if (!userId || !eventKey || !type || !title || !message) return null;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const event = await client.query(
      `INSERT INTO notification_events (user_id, event_key, channel, status, metadata)
       VALUES ($1,$2,'in_app','pending',$3)
       ON CONFLICT (user_id, event_key, channel) DO NOTHING
       RETURNING id`,
      [userId, eventKey, metadata]
    );

    if (!event.rows.length) {
      await client.query("ROLLBACK");
      return null;
    }

    const notification = await client.query(
      `INSERT INTO notifications
        (user_id, type, title, message, entity_type, entity_id, action_url, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING ${publicNotificationFields}`,
      [
        userId,
        toText(type, 80),
        toText(title, 140),
        toText(message, 500),
        entityType ? toText(entityType, 80) : null,
        entityId || null,
        actionUrl ? toText(actionUrl, 300) : null,
        metadata
      ]
    );

    await client.query(`UPDATE notification_events SET status='sent' WHERE id=$1`, [event.rows[0].id]);
    await client.query("COMMIT");
    return notification.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const listNotificationsDB = async (userId, limit = 30, before) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 50);
  const params = [userId, safeLimit];
  let where = "WHERE user_id=$1";

  if (before) {
    params.push(before);
    where += ` AND created_at < $3`;
  }

  const { rows } = await pool.query(
    `SELECT ${publicNotificationFields}
     FROM notifications
     ${where}
     ORDER BY created_at DESC
     LIMIT $2`,
    params
  );

  return rows;
};

export const unreadCountDB = async (userId) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM notifications
     WHERE user_id=$1 AND read_at IS NULL`,
    [userId]
  );
  return rows[0]?.count || 0;
};

export const markNotificationReadDB = async (userId, notificationId) => {
  const { rows } = await pool.query(
    `UPDATE notifications
     SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
     WHERE id=$1 AND user_id=$2
     RETURNING ${publicNotificationFields}`,
    [notificationId, userId]
  );
  return rows[0] || null;
};

export const markAllNotificationsReadDB = async (userId) => {
  const { rowCount } = await pool.query(
    `UPDATE notifications
     SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
     WHERE user_id=$1 AND read_at IS NULL`,
    [userId]
  );
  return rowCount;
};
