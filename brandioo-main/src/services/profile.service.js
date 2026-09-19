import pool from "../config/db.js";
import cloudinary from "../config/cloudinary.js";

export const slugifyHandleBase = (value = "creator") => {
  const base = String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);
  return base || "creator";
};

export const ensurePublicSlugDB = async (userId, name) => {
  const current = await pool.query("SELECT public_slug, username FROM users WHERE id=$1", [userId]);
  if (current.rows[0]?.public_slug) return current.rows[0].public_slug;

  const base = slugifyHandleBase(name || current.rows[0]?.username);
  for (let i = 0; i < 12; i++) {
    const suffix = Math.random().toString(36).slice(2, i < 4 ? 4 : 5);
    const candidate = `${base}-${suffix}`;
    const exists = await pool.query("SELECT 1 FROM users WHERE lower(public_slug)=lower($1) AND id<>$2", [candidate, userId]);
    if (!exists.rows.length) {
      await pool.query("UPDATE users SET public_slug=$1 WHERE id=$2", [candidate, userId]);
      return candidate;
    }
  }
  const fallback = `${base}-${Date.now().toString(36).slice(-4)}`;
  await pool.query("UPDATE users SET public_slug=$1 WHERE id=$2", [fallback, userId]);
  return fallback;
};

export const updatePublicSlugDB = async (userId, requested) => {
  const base = slugifyHandleBase(requested);
  if (base.length < 3) {
    const err = new Error("Public handle must be at least 3 characters");
    err.status = 400;
    throw err;
  }
  const exists = await pool.query("SELECT 1 FROM users WHERE lower(public_slug)=lower($1) AND id<>$2", [base, userId]);
  if (exists.rows.length) {
    const err = new Error("Public handle is already taken");
    err.status = 409;
    throw err;
  }
  const { rows } = await pool.query(
    `UPDATE users SET public_slug=$1 WHERE id=$2
     RETURNING id, username, public_slug, email, plan, plan_expiry, profile_image_url,
       social_links, country_code, media_kit_enabled, media_kit`,
    [base, userId]
  );
  return rows[0];
};

export const updateProfileDB = async (userId, username) => {
  const { rows } = await pool.query(
    `UPDATE users SET username=$1 WHERE id=$2
     RETURNING id, username, email, plan, profile_image_url, social_links,
       public_slug, media_kit_enabled, media_kit`,
    [username, userId]
  );
  return rows[0];
};

export const updateSocialLinksDB = async (userId, socialLinks) => {
  const { rows } = await pool.query(
    `UPDATE users
     SET social_links = $1
     WHERE id = $2
     RETURNING social_links`,
    [socialLinks, userId]
  );

  return rows[0];
};




