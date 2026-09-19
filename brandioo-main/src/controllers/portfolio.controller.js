import cloudinary from "../config/cloudinary.js";
import {
  getPortfolioItems,
  getPortfolioItem,
  getPortfolioStats,
  getPortfolioCandidates,
  findDealForPortfolio,
  createPortfolioItemDB,
  updatePortfolioItemDB,
  setVisibilityDB,
  setFeaturedDB,
  deletePortfolioItemDB,
  toDateString
} from "../services/portfolio.service.js";

/* =========================================================
   PORTFOLIO · CONTROLLER
   Portfolio is available on every plan — items are derived
   from the creator's own completed deals, so existing free
   plan deal limits already bound the portfolio size.
   ========================================================= */

const METRIC_KEYS = [
  "views",
  "likes",
  "comments",
  "shares",
  "saves",
  "engagement_rate"
];

const MAX_DELIVERABLES = 8;

/* "1 Reel, 2 Stories" | ["1 Reel","2 Stories"] -> ["1 Reel","2 Stories"] */
const normalizeDeliverables = (input) => {
  if (!input) return [];

  const list = Array.isArray(input) ? input : String(input).split(",");

  return list
    .map((entry) => String(entry).trim())
    .filter(Boolean)
    .slice(0, MAX_DELIVERABLES)
    .map((entry) => entry.slice(0, 40));
};

const normalizeMetrics = (input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};

  const metrics = {};

  for (const key of METRIC_KEYS) {
    const raw = input[key];
    if (raw === undefined || raw === null || raw === "") continue;

    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) continue;

    metrics[key] = value;
  }

  return metrics;
};

const normalizeUrl = (value) => {
  if (!value) return null;

  const url = String(value).trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) return null;

  return url.slice(0, 500);
};

const normalizeDate = (value) => {
  if (!value) return null;

  const date = toDateString(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(date || "") ? date : null;
};

const normalizeText = (value, max) => {
  if (value === undefined) return undefined;
  const text = String(value || "").trim();
  return text ? text.slice(0, max) : null;
};

/* Builds a whitelisted, normalized payload from the request body */
const buildPayload = (body) => {
  const payload = {};

  if ("campaign_title" in body)
    payload.campaign_title = normalizeText(body.campaign_title, 150);

  if ("deliverables" in body)
    payload.deliverables = normalizeDeliverables(body.deliverables);

  if ("completion_date" in body)
    payload.completion_date = normalizeDate(body.completion_date);

  if ("content_url" in body) {
    const url = normalizeUrl(body.content_url);
    payload.content_url = url;
  }

  if ("thumbnail_url" in body) {
    payload.thumbnail_url = body.thumbnail_url
      ? String(body.thumbnail_url).trim().slice(0, 500) || null
      : null;
  }

  if ("metrics" in body) payload.metrics = normalizeMetrics(body.metrics);

  if ("creator_notes" in body)
    payload.creator_notes = normalizeText(body.creator_notes, 2000);

  if ("is_public" in body) payload.is_public = body.is_public === true;
  if ("is_featured" in body) payload.is_featured = body.is_featured === true;

  return payload;
};

const invalidUrl = (body) =>
  Boolean(body.content_url) && !normalizeUrl(body.content_url);

/* ---------------------------------------------------------------- read ---- */

export const getPortfolio = async (req, res) => {
  try {
    const userId = req.user.id;

    const [items, stats] = await Promise.all([
      getPortfolioItems(userId, req.query.filter),
      getPortfolioStats(userId)
    ]);

    res.json({ items, stats });
  } catch (err) {
    console.error("GET PORTFOLIO ERROR:", err);
    res.status(500).json({ message: "Failed to load portfolio" });
  }
};

export const getCandidates = async (req, res) => {
  try {
    const deals = await getPortfolioCandidates(req.user.id);
    res.json({ deals });
  } catch (err) {
    console.error("GET PORTFOLIO CANDIDATES ERROR:", err);
    res.status(500).json({ message: "Failed to load completed deals" });
  }
};

/* Signed Cloudinary upload for portfolio thumbnails */
export const getUploadSignature = async (req, res) => {
  const userId = req.user.id;
  const timestamp = Math.round(Date.now() / 1000);
  const folder = `brandio/portfolio/${userId}`;

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET
  );

  res.json({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    timestamp,
    signature,
    folder
  });
};

/* -------------------------------------------------------------- create ---- */

export const createPortfolioItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { deal_id } = req.body;

    if (!deal_id) {
      return res
        .status(400)
        .json({ message: "Select a completed deal to add to your portfolio" });
    }

    if (invalidUrl(req.body)) {
      return res.status(400).json({
        message: "Content URL must be a valid link starting with http:// or https://"
      });
    }

    const deal = await findDealForPortfolio(userId, deal_id);
    if (!deal) return res.status(404).json({ message: "Deal not found" });

    if (deal.status !== "completed") {
      return res.status(400).json({
        message: "Only completed deals can be added to your portfolio"
      });
    }

    const payload = buildPayload(req.body);

    const item = await createPortfolioItemDB(userId, {
      deal_id,
      campaign_title: payload.campaign_title || deal.brand_name,
      deliverables: payload.deliverables || [],
      completion_date:
        payload.completion_date || toDateString(deal.posting_date) || null,
      content_url: payload.content_url || null,
      thumbnail_url: payload.thumbnail_url || null,
      metrics: payload.metrics || {},
      creator_notes: payload.creator_notes || null,
      is_public: payload.is_public === true,
      is_featured: payload.is_featured === true
    });

    if (!item) {
      return res
        .status(409)
        .json({ message: "This deal is already in your portfolio" });
    }

    res.status(201).json(item);
  } catch (err) {
    console.error("CREATE PORTFOLIO ITEM ERROR:", err);
    res.status(500).json({ message: "Failed to add portfolio item" });
  }
};

/* -------------------------------------------------------------- update ---- */

export const updatePortfolioItem = async (req, res) => {
  try {
    if (invalidUrl(req.body)) {
      return res.status(400).json({
        message: "Content URL must be a valid link starting with http:// or https://"
      });
    }

    const item = await updatePortfolioItemDB(
      req.user.id,
      req.params.id,
      buildPayload(req.body)
    );

    if (!item) {
      return res.status(404).json({ message: "Portfolio item not found" });
    }

    res.json(item);
  } catch (err) {
    console.error("UPDATE PORTFOLIO ITEM ERROR:", err);
    res.status(500).json({ message: "Failed to update portfolio item" });
  }
};

/* ------------------------------------------------------------- toggles ---- */

export const toggleVisibility = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;

    let isPublic =
      typeof req.body.is_public === "boolean" ? req.body.is_public : null;

    if (isPublic === null) {
      const current = await getPortfolioItem(userId, itemId);
      if (!current) {
        return res.status(404).json({ message: "Portfolio item not found" });
      }
      isPublic = !current.is_public;
    }

    const item = await setVisibilityDB(userId, itemId, isPublic);
    if (!item) {
      return res.status(404).json({ message: "Portfolio item not found" });
    }

    res.json(item);
  } catch (err) {
    console.error("TOGGLE PORTFOLIO VISIBILITY ERROR:", err);
    res.status(500).json({ message: "Failed to update visibility" });
  }
};

export const toggleFeatured = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;

    let isFeatured =
      typeof req.body.is_featured === "boolean" ? req.body.is_featured : null;

    if (isFeatured === null) {
      const current = await getPortfolioItem(userId, itemId);
      if (!current) {
        return res.status(404).json({ message: "Portfolio item not found" });
      }
      isFeatured = !current.is_featured;
    }

    const item = await setFeaturedDB(userId, itemId, isFeatured);
    if (!item) {
      return res.status(404).json({ message: "Portfolio item not found" });
    }

    res.json(item);
  } catch (err) {
    console.error("TOGGLE PORTFOLIO FEATURED ERROR:", err);
    res.status(500).json({ message: "Failed to update featured status" });
  }
};

/* -------------------------------------------------------------- delete ---- */

export const deletePortfolioItem = async (req, res) => {
  try {
    const removed = await deletePortfolioItemDB(req.user.id, req.params.id);

    if (!removed) {
      return res.status(404).json({ message: "Portfolio item not found" });
    }

    res.json({ message: "Portfolio item removed" });
  } catch (err) {
    console.error("DELETE PORTFOLIO ITEM ERROR:", err);
    res.status(500).json({ message: "Failed to remove portfolio item" });
  }
};