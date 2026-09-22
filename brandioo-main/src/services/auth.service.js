import bcrypt from "bcrypt";
import pool from "../config/db.js";
import { slugifyHandleBase } from "./profile.service.js";

export const createUser = async ({ username, email, password, country_code }) => {
  const hashed = await bcrypt.hash(password, 10);
  const publicSlug = await uniquePublicSlug(username);

  const { rows } = await pool.query(
    `INSERT INTO users (username, email, password_hash, country_code, public_slug)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id, username, public_slug, email, country_code, plan, deal_creations_used`,
    [username, email, hashed, country_code, publicSlug]
  );

  return rows[0];
};

const uniquePublicSlug = async (username) => {
  const base = slugifyHandleBase(username);
  for (let i = 0; i < 16; i++) {
    const candidate = `${base}-${Math.random().toString(36).slice(2, i < 6 ? 5 : 6)}`;
    const { rows } = await pool.query("SELECT 1 FROM users WHERE lower(public_slug)=lower($1)", [candidate]);
    if (!rows.length) return candidate;
  }
  return `${base}-${Date.now().toString(36).slice(-4)}`;
};

export const findUserByEmail = async (email) => {
  const { rows } = await pool.query(
    `SELECT * FROM users WHERE email=$1`,
    [email]
  );
  return rows[0];
};

export const validatePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};
