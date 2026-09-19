import { sendNewInquiryEmail } from "../services/email.service.js";
import { createNotificationOnce } from "../services/notification.service.js";
import {
  createInquiryDB,
  getCreatorEmail,
  getInquiriesDB,
  getInquiryStatsDB,
  getPublicCreator,
  updateInquiryDB
} from "../services/inbound.service.js";

const STATUSES = ["new", "reviewing", "negotiating", "accepted", "rejected", "archived"];

const text = (value, max = 500) => {
  const v = String(value || "").trim();
  return v ? v.slice(0, max) : null;
};

const email = (value) => {
  const v = text(value, 180);
  return v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : null;
};

const date = (value) => {
  const v = text(value, 20);
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
};

export const getCreatorPage = async (req, res) => {
  const creator = await getPublicCreator(req.params.username);
  if (!creator) return res.status(404).json({ message: "Creator not found" });

  res.json({
    creator: {
      username: creator.username,
      public_slug: creator.public_slug || creator.username,
      profile_image_url: creator.profile_image_url,
      social_links: creator.social_links || {}
    }
  });
};

export const createPublicInquiry = async (req, res) => {
  try {
    const creator = await getPublicCreator(req.params.username);
    if (!creator) return res.status(404).json({ message: "Creator not found" });

    const payload = {
      brand: text(req.body.brand, 150),
      contact: text(req.body.contact, 150),
      email: email(req.body.email),
      website: text(req.body.website, 300),
      campaign: text(req.body.campaign, 180),
      campaign_type: text(req.body.campaign_type, 80),
      budget: text(req.body.budget, 80),
      platform: text(req.body.platform, 80),
      deliverables: text(req.body.deliverables, 1000),
      deadline: date(req.body.deadline),
      usage_requirements: text(req.body.usage_requirements, 1000),
      description: text(req.body.description, 2000)
    };

    if (!payload.brand || !payload.contact || !payload.email) {
      return res.status(400).json({
        message: "Brand, contact person and email are required"
      });
    }

    const inquiry = await createInquiryDB(creator.id, payload);
    const recipient = await getCreatorEmail(creator.id);

    createNotificationOnce({
      userId: creator.id,
      eventKey: `inbound:${inquiry.id}:created`,
      type: "inbound_inquiry",
      title: "New inbound inquiry",
      message: `You received a new collaboration inquiry from ${payload.brand}.`,
      entityType: "inbound_inquiry",
      entityId: inquiry.id,
      actionUrl: "/inbound"
    }).catch(() => {});

    if (recipient?.email) {
      sendNewInquiryEmail({
        to: recipient.email,
        inquiry: payload,
        userId: creator.id
      }).catch(() => {});
    }

    res.status(201).json({ message: "Inquiry sent", inquiry_id: inquiry.id });
  } catch (err) {
    console.error("CREATE INBOUND INQUIRY ERROR:", err);
    res.status(500).json({ message: "Could not send inquiry" });
  }
};

export const listInquiries = async (req, res) => {
  try {
    const [inquiries, stats] = await Promise.all([
      getInquiriesDB(req.user.id, req.query.filter),
      getInquiryStatsDB(req.user.id)
    ]);
    res.json({ inquiries, stats });
  } catch (err) {
    console.error("LIST INQUIRIES ERROR:", err);
    res.status(500).json({ message: "Could not load inquiries" });
  }
};

export const updateInquiry = async (req, res) => {
  try {
    const payload = {};
    if ("notes" in req.body) payload.notes = text(req.body.notes, 2000);
    if ("status" in req.body) {
      if (!STATUSES.includes(req.body.status)) {
        return res.status(400).json({ message: "Invalid inquiry status" });
      }
      payload.status = req.body.status;
    }
    if ("converted_deal_id" in req.body) {
      payload.converted_deal_id = text(req.body.converted_deal_id, 80);
      if (payload.converted_deal_id) payload.status = "accepted";
    }

    const updated = await updateInquiryDB(req.user.id, req.params.id, payload);
    if (!updated) return res.status(404).json({ message: "Inquiry not found" });
    res.json(updated);
  } catch (err) {
    console.error("UPDATE INQUIRY ERROR:", err);
    res.status(500).json({ message: "Could not update inquiry" });
  }
};
