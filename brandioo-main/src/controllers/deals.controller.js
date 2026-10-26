import {
  createDealDB,
  releaseDealCreation,
  reserveDealCreation,
  getDealDB,
  getDealsDB,
  updateDealDB,
  deleteDealDB
} from "../services/deals.service.js";
import pool from "../config/db.js";
import cloudinary from "../config/cloudinary.js";
import { sendDealCreatedEmail } from "../services/email.service.js";
import { createNotificationOnce } from "../services/notification.service.js";

const applyOverdueLogic = (deal, plan) => {
  if (
    deal.payment_due_date &&
    deal.status !== "completed"
  ) {
    if (new Date(deal.payment_due_date) < new Date()) {
      return "overdue";
    }
  }
  return deal.status;
};

export const createDeal = async (req, res) => {
  const userId = req.user.id;

  const user = await reserveDealCreation(userId);
  if (!user) {
    return res.status(403).json({
      message: "Your 1 lifetime free deal has been used. All features remain available for your existing deal. Upgrade to add more deals."
    });
  }

  let deal;
  try {
    deal = await createDealDB(userId, req.body);
  } catch (err) {
    await releaseDealCreation(userId);
    throw err;
  }
  createNotificationOnce({
    userId,
    eventKey: `deal:${deal.id}:created`,
    type: "deal_created",
    title: "Deal created",
    message: `Your deal with ${deal.brand_name} was added to Brandio.`,
    entityType: "deal",
    entityId: deal.id,
    actionUrl: `/deals/${deal.id}`
  }).catch(() => {});

  if (user.email) {
    sendDealCreatedEmail({
      to: user.email,
      deal,
      userId
    }).catch(() => {});
  }
  res.json(deal);
};

export const getDeals = async (req, res) => {
  const userId = req.user.id;
  const filter = req.query.filter;

  const { rows } = await pool.query(
    `SELECT plan FROM users WHERE id=$1`,
    [userId]
  );
  const plan = rows[0].plan;

  let deals = await getDealsDB(userId, filter);

  deals = deals.map(d => ({
    ...d,
    status: applyOverdueLogic(d, plan)
  }));

  res.json({ deals });
};

export const getDeal = async (req, res) => {
  const userId = req.user.id;

  const { rows } = await pool.query(
    `SELECT plan FROM users WHERE id=$1`,
    [userId]
  );
  const plan = rows[0].plan;

  const deal = await getDealDB(userId, req.params.id);
  if (!deal) return res.status(404).json({ message: "Deal not found" });

  res.json({
    ...deal,
    status: applyOverdueLogic(deal, plan)
  });
};

export const updateDeal = async (req, res) => {
  const allowed = [
    "brand_name",
    "platform",
    "platform_custom",
    "amount",
    "currency",
    "status",
    "posting_date",
    "payment_due_date",
    "hours_spent",
    "revision_count",
    "deliverable_count",
    "expenses",
    "paid_date",
    "roi_notes",
    "deal_type",
    "product_name",
    "product_value",
    "received_date",
    "deliverables",
    "expected_content_date",
    "shipping_tracking",
    "notes",
    "fixed_amount",
    "commission_percentage",
    "commission_earned",
    "total_earned"
  ];
  const body = {};
  for (const key of allowed) {
    if (key in req.body) body[key] = req.body[key];
  }

  /* Normalize numbers: empty string means "not set". */
  for (const key of ["amount", "hours_spent", "expenses", "product_value", "fixed_amount", "commission_percentage", "commission_earned", "total_earned"]) {
    if (body[key] === "" || body[key] === undefined) delete body[key];
    else if (body[key] !== null) {
      const n = Number(body[key]);
      if (!Number.isFinite(n) || n < 0) {
        return res.status(400).json({ message: `${key} must be a valid non-negative number` });
      }
      body[key] = n;
    }
  }
  for (const key of ["revision_count", "deliverable_count"]) {
    if (body[key] === "" || body[key] === undefined) delete body[key];
    else if (body[key] !== null) {
      const n = Math.trunc(Number(body[key]));
      if (!Number.isFinite(n) || n < 0) {
        return res.status(400).json({ message: `${key} must be a valid non-negative integer` });
      }
      body[key] = n;
    }
  }
  for (const key of ["posting_date", "payment_due_date", "paid_date", "received_date", "expected_content_date"]) {
    if (body[key] === "") delete body[key];
  }

  const deal = await updateDealDB(req.user.id, req.params.id, body);

  if (!deal) return res.status(404).json({ message: "Deal not found" });
  res.json(deal);
};

export const deleteDeal = async (req, res) => {
  const userId = req.user.id;

  await deleteDealDB(userId, req.params.id);
  res.json({ message: "Deal deleted" });
};

export const getDealUploadSignature = async (req, res) => {
  const userId = req.user.id;
  const dealId = req.params.id;

  // 🔢 check image count
  const deal = await pool.query(
    `SELECT proof_images FROM deals WHERE id=$1 AND user_id=$2`,
    [dealId, userId]
  );

  if (!deal.rows.length) {
    return res.status(404).json({ message: "Deal not found" });
  }

  if (deal.rows[0].proof_images.length >= 2) {
    return res.status(400).json({
      message: "Maximum 2 proof images allowed"
    });
  }

  const timestamp = Math.round(Date.now() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder: `brandio/deals/${dealId}`
    },
    process.env.CLOUDINARY_API_SECRET
  );

  res.json({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    timestamp,
    signature
  });
};

export const addDealImage = async (req, res) => {
  const userId = req.user.id;
  const dealId = req.params.id;
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ message: "Missing image URL" });
  }

  const { rows } = await pool.query(
    `UPDATE deals
     SET proof_images = array_append(proof_images, $1)
     WHERE id=$2 AND user_id=$3
     RETURNING proof_images`,
    [imageUrl, dealId, userId]
  );

  res.json(rows[0]);
};
