import pool from "../config/db.js";
import { ensurePublicSlugDB, updateProfileDB, updatePublicSlugDB } from "../services/profile.service.js";
import cloudinary from "../config/cloudinary.js";
import { updateSocialLinksDB } from "../services/profile.service.js";
import { validateSocialLinks } from "../utils/validateSocialLinks.js";



export const me = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, username, email, plan, plan_expiry,
            profile_image_url, social_links, country_code, public_slug,
            media_kit_enabled, media_kit
     FROM users WHERE id=$1`,
    [req.user.id]
  );

  if (rows[0] && !rows[0].public_slug) {
    rows[0].public_slug = await ensurePublicSlugDB(req.user.id, rows[0].media_kit?.display_name || rows[0].username);
  }

  res.json(rows[0]);
};


export const updateProfile = async (req, res) => {
  const username = String(req.body.username || "").trim().slice(0, 80);
  if (username.length < 2) return res.status(400).json({ message: "Enter a valid name" });
  const user = await updateProfileDB(req.user.id, username);
  res.json(user);
};

export const updatePublicSlug = async (req, res) => {
  try {
    const user = await updatePublicSlugDB(req.user.id, req.body.public_slug);
    res.json(user);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Could not update public handle" });
  }
};


export const updateSocials = async (req, res) => {
  try {
    const { social_links } = req.body;

    if (typeof social_links !== "object") {
      return res.status(400).json({ message: "Invalid social links" });
    }

    const error = validateSocialLinks(social_links);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const updated = await updateSocialLinksDB(
      req.user.id,
      social_links
    );

    res.json(updated);
  } catch (err) {
    console.error("UPDATE SOCIALS ERROR:", err);
    res.status(500).json({ message: "Enter Valid URL" });
  }
};


/* 1️⃣ Get signed upload data */


// controllers/profile.controller.js
export const uploadProfilePhoto = async (req, res) => {
  const userId = req.user.id;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const result = await cloudinary.uploader.upload(file.path, {
    folder: "brandio/profile",
    transformation: [{ width: 300, height: 300, crop: "fill" }]
  });

  await pool.query(
    "UPDATE users SET profile_image_url=$1 WHERE id=$2",
    [result.secure_url, userId]
  );

  res.json({ url: result.secure_url });
};

export const getProfileUploadSignature = async (req, res) => {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = `brandio/profile/${req.user.id}`;
  const transformation = "c_fill,h_300,w_300";
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder, transformation },
    process.env.CLOUDINARY_API_SECRET
  );

  res.json({
    timestamp,
    folder,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    transformation
  });
};

export const saveProfilePhoto = async (req, res) => {
  const url = String(req.body.url || "").trim();
  if (!/^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(url)) {
    return res.status(400).json({ message: "Invalid profile image" });
  }

  const safeUrl = url.slice(0, 500);
  await pool.query(
    "UPDATE users SET profile_image_url=$1 WHERE id=$2",
    [safeUrl, req.user.id]
  );

  res.json({ success: true, url: safeUrl });
};





