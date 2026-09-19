import {
  STATUSES,
  createDeliverableDB,
  deleteDeliverableDB,
  getDealDeliverablesDB,
  getDeliverableStatsDB,
  getDeliverablesDB,
  updateDeliverableDB
} from "../services/deliverables.service.js";

const text = (value, max = 1000) => {
  if (value === undefined) return undefined;
  const v = String(value || "").trim();
  return v ? v.slice(0, max) : null;
};

const date = (value) => {
  if (!value) return null;
  const v = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
};

const payload = (body = {}) => {
  const p = {};
  if ("title" in body) p.title = text(body.title, 180);
  if ("type" in body) p.type = text(body.type, 80);
  if ("platform" in body) p.platform = text(body.platform, 80);
  if ("description" in body) p.description = text(body.description, 1200);
  if ("due_date" in body) p.due_date = date(body.due_date);
  if ("status" in body && STATUSES.includes(body.status)) p.status = body.status;
  if ("submission_date" in body) p.submission_date = date(body.submission_date);
  if ("approval_date" in body) p.approval_date = date(body.approval_date);
  if ("content_url" in body) p.content_url = text(body.content_url, 600);
  if ("notes" in body) p.notes = text(body.notes, 2000);
  if ("revision_count" in body) p.revision_count = Math.max(0, Math.trunc(Number(body.revision_count) || 0));
  return p;
};

export const listDeliverables = async (req, res) => {
  try {
    const [deliverables, stats] = await Promise.all([
      getDeliverablesDB(req.user.id, req.query.filter),
      getDeliverableStatsDB(req.user.id)
    ]);
    res.json({ deliverables, stats });
  } catch (err) {
    console.error("LIST DELIVERABLES ERROR:", err);
    res.status(500).json({ message: "Could not load deliverables" });
  }
};

export const listDealDeliverables = async (req, res) => {
  try {
    const deliverables = await getDealDeliverablesDB(req.user.id, req.params.dealId);
    res.json({ deliverables });
  } catch (err) {
    console.error("LIST DEAL DELIVERABLES ERROR:", err);
    res.status(500).json({ message: "Could not load deal deliverables" });
  }
};

export const createDeliverable = async (req, res) => {
  try {
    const data = payload(req.body);
    if (!data.title) return res.status(400).json({ message: "Title is required" });
    const item = await createDeliverableDB(req.user.id, req.params.dealId, data);
    if (!item) return res.status(404).json({ message: "Deal not found" });
    res.status(201).json(item);
  } catch (err) {
    console.error("CREATE DELIVERABLE ERROR:", err);
    res.status(500).json({ message: "Could not create deliverable" });
  }
};

export const updateDeliverable = async (req, res) => {
  try {
    const item = await updateDeliverableDB(req.user.id, req.params.id, payload(req.body));
    if (!item) return res.status(404).json({ message: "Deliverable not found" });
    res.json(item);
  } catch (err) {
    console.error("UPDATE DELIVERABLE ERROR:", err);
    res.status(500).json({ message: "Could not update deliverable" });
  }
};

export const deleteDeliverable = async (req, res) => {
  try {
    const removed = await deleteDeliverableDB(req.user.id, req.params.id);
    if (!removed) return res.status(404).json({ message: "Deliverable not found" });
    res.json({ message: "Deliverable removed" });
  } catch (err) {
    console.error("DELETE DELIVERABLE ERROR:", err);
    res.status(500).json({ message: "Could not remove deliverable" });
  }
};
