import pool from "../config/db.js";

export const getPublicCreatorBySlug = async (slug) => {
  const handle = String(slug || "").trim();
  if (!handle) return null;

  const { rows } = await pool.query(
    `SELECT
       id,
       username,
       COALESCE(NULLIF(public_slug, ''), username) AS public_slug,
       profile_image_url,
       social_links,
       media_kit,
       media_kit_enabled
     FROM users
     WHERE lower(COALESCE(NULLIF(public_slug, ''), username)) = lower($1)
        OR lower(username) = lower($1)
     ORDER BY CASE
       WHEN lower(COALESCE(NULLIF(public_slug, ''), username)) = lower($1) THEN 0
       ELSE 1
     END
     LIMIT 1`,
    [handle]
  );

  return rows[0] || null;
};
