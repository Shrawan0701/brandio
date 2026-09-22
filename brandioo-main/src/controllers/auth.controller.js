import {
  createUser,
  findUserByEmail,
  validatePassword
} from "../services/auth.service.js";
import { signToken } from "../utils/jwt.js";
import { sendPasswordResetOtp, sendWelcomeEmail } from "../services/email.service.js";
import pool from "../config/db.js";
import bcrypt from "bcrypt";

const cleanText = (value, max = 160) => String(value || "").trim().slice(0, max);
const cleanEmail = (value) => cleanText(value, 180).toLowerCase();
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validPassword = (value) => typeof value === "string" && value.length >= 8 && value.length <= 128;

export const register = async (req, res) => {
  try {
    const username = cleanText(req.body.username, 80);
    const email = cleanEmail(req.body.email);
    const password = req.body.password;
    const country_code = cleanText(req.body.country, 8).toUpperCase();


    if (!username || !email || !password || !country_code)
      return res.status(400).json({ message: "Missing fields" });
    if (!validEmail(email)) return res.status(400).json({ message: "Enter a valid email" });
    if (!validPassword(password)) return res.status(400).json({ message: "Password must be at least 8 characters" });

    const exists = await findUserByEmail(email);
    if (exists)
      return res.status(409).json({ message: "Email already registered" });

    const user = await createUser({ username, email, password, country_code });
    
    

    const token = signToken({ id: user.id });

    // fire-and-forget email (do NOT await)
    sendWelcomeEmail({
      to: user.email,
      username: user.username,
      userId: user.id
    }).catch(() => {});

    return res
     .cookie("token", token, {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production"

      })
      .json({ ...user, token });

  } catch (err) {
    if (process.env.NODE_ENV !== "production") console.error("REGISTER_ERROR", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};



export const login = async (req, res) => {
  const email = cleanEmail(req.body.email);
  const password = req.body.password;

  if (!validEmail(email) || typeof password !== "string") {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const user = await findUserByEmail(email);
  if (!user)
    return res.status(401).json({ message: "Invalid credentials" });

  const valid = await validatePassword(password, user.password_hash);
  if (!valid)
    return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken({ id: user.id });

  res
    .cookie("token", token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production"
    })
    .json({
      id: user.id,
      username: user.username,
      public_slug: user.public_slug,
      email: user.email,
      plan: user.plan,
      plan_expiry: user.plan_expiry,
      deal_creations_used: user.deal_creations_used,
      token
    });

};

export const sendResetOTP = async (req, res) => {
  const email = cleanEmail(req.body.email);

  if (!validEmail(email)) {
    return res.status(400).json({ message: "Enter a valid email" });
  }

  const user = await pool.query(
    "SELECT id FROM users WHERE email=$1",
    [email]
  );

  if (!user.rows.length) {
    return res.status(404).json({ message: "No account found with this email." });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  await pool.query(
    `UPDATE users
     SET reset_otp=$1, reset_otp_expiry=$2
     WHERE email=$3`,
    [otp, expiry, email]
  );

  try {
    await sendPasswordResetOtp({ to: email, otp, userId: user.rows[0].id });
  } catch {
    return res.status(503).json({
      message: "We couldn't send the email right now. Please try again."
    });
  }

  res.json({ message: "OTP sent" });
};

/* VERIFY OTP + RESET PASSWORD */
export const resetPassword = async (req, res) => {
  const email = cleanEmail(req.body.email);
  const otp = cleanText(req.body.otp, 6);
  const password = req.body.password;

  if (!validEmail(email) || !/^\d{6}$/.test(otp) || !validPassword(password)) {
    return res.status(400).json({ message: "Invalid request" });
  }

  const user = await pool.query(
    `SELECT id, reset_otp, reset_otp_expiry
     FROM users WHERE email=$1`,
    [email]
  );

  if (!user.rows.length) {
    return res.status(400).json({ message: "Invalid request" });
  }

  if (
    user.rows[0].reset_otp !== otp ||
    new Date(user.rows[0].reset_otp_expiry) < new Date()
  ) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  const hash = await bcrypt.hash(password, 10);

  await pool.query(
    `UPDATE users
     SET password_hash=$1,
         reset_otp=NULL,
         reset_otp_expiry=NULL
     WHERE email=$2`,
    [hash, email]
  );

  res.json({ message: "Password reset successful" });
};


export const logout = (req, res) => {
  res
    .clearCookie("token", {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production"
    })
    .json({ message: "Logged out" });
};
