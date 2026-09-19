import cloudinary from "../config/cloudinary.js";
import {
  getContracts,
  getContractById,
  getContractByDeal,
  getContractStats,
  findDealForContract,
  createContractDB,
  updateContractDB,
  setStatusDB,
  setSignatureDB,
  deleteContractDB,
  toDateString
} from "../services/contracts.service.js";

/* =========================================================
   CONTRACTS · CONTROLLER
   Every plan — contracts ride on the creator's own deals.
   "Signed" is creator-marked tracking only; this project
   has no legal e-signature infrastructure.
   ========================================================= */

const STATUSES = ["awaiting_signature", "signed", "expired"];
const SIGNATURES = ["unsigned", "awaiting", "signed"];

const normalizeText = (value, max) => {
  if (value === undefined) return undefined;
  const text = String(value || "").trim();
  return text ? text.slice(0, max) : null;
};

const normalizeUrl = (value) => {
  if (!value) return null;
  const url = String(value).trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) return null;
  return url.slice(0, 1000);
};

const normalizeDate = (value) => {
  if (!value) return null;
  return toDateString(value);
};

/* Whitelisted metadata payload (status/signature excluded) */
const buildPayload = (body) => {
  const payload = {};
  if ("title" in body) payload.title = normalizeText(body.title, 150);
  if ("notes" in body) payload.notes = normalizeText(body.notes, 2000);
  if ("file_url" in body) {
    payload.file_url = body.file_url ? normalizeUrl(body.file_url) : null;
  }
  if ("file_name" in body) {
    payload.file_name = body.file_name
      ? String(body.file_name).trim().slice(0, 255) || null
      : null;
  }
  if ("expires_at" in body) payload.expires_at = normalizeDate(body.expires_at);
  return payload;
};

const invalidFileUrl = (body) =>
  Boolean(body.file_url) && !normalizeUrl(body.file_url);

export const listContracts = async (req, res) => {
  try {
    const [contracts, stats] = await Promise.all([
      getContracts(req.user.id, req.query.filter),
      getContractStats(req.user.id)
    ]);
    res.json({ contracts, stats });
  } catch (err) {
    console.error("LIST CONTRACTS ERROR:", err);
    res.status(500).json({ message: "Failed to load contracts" });
  }
};

export const getDealContract = async (req, res) => {
  try {
    const c = await getContractByDeal(req.user.id, req.params.dealId);
    if (!c) return res.status(404).json({ message: "No contract for this deal yet" });
    res.json(c);
  } catch (err) {
    console.error("GET DEAL CONTRACT ERROR:", err);
    res.status(500).json({ message: "Failed to load contract" });
  }
};

export const getContract = async (req, res) => {
  try {
    const c = await getContractById(req.user.id, req.params.id);
    if (!c) return res.status(404).json({ message: "Contract not found" });
    res.json(c);
  } catch (err) {
    console.error("GET CONTRACT ERROR:", err);
    res.status(500).json({ message: "Failed to load contract" });
  }
};

/* Signed Cloudinary upload for contract docs — same storage
   approach as deal proof images, only the URL is persisted. */
export const getUploadSignature = async (req, res) => {
  try {
    const userId = req.user.id;
    const timestamp = Math.round(Date.now() / 1000);
    const folder = `brandio/contracts/${userId}`;
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET
    );
    res.json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      timestamp, signature, folder
    });
  } catch (err) {
    console.error("CONTRACT UPLOAD SIGNATURE ERROR:", err);
    res.status(500).json({ message: "Failed to prepare upload" });
  }
};

export const attachContract = async (req, res) => {
  try {
    const userId = req.user.id;
    const dealId = req.params.dealId || req.body.deal_id;
    if (!dealId) {
      return res.status(400).json({ message: "Select a deal for this contract" });
    }
    if (invalidFileUrl(req.body)) {
      return res.status(400).json({
        message: "Contract file URL must start with http:// or https://"
      });
    }
    const deal = await findDealForContract(userId, dealId);
    if (!deal) return res.status(404).json({ message: "Deal not found" });
    const payload = buildPayload(req.body);
    let status = "awaiting_signature";
    if (req.body.status && STATUSES.includes(req.body.status)) status = req.body.status;
    let signature = "awaiting";
    if (req.body.signature_status && SIGNATURES.includes(req.body.signature_status)) {
      signature = req.body.signature_status;
    }
    if (status === "signed") signature = "signed";
    const contract = await createContractDB(userId, dealId, {
      title: payload.title || `${deal.brand_name} — Contract`,
      status,
      signature_status: signature,
      file_url: payload.file_url || null,
      file_name: payload.file_name || null,
      notes: payload.notes || null,
      signed_at: status === "signed" ? toDateString(new Date()) : null,
      expires_at: payload.expires_at || null
    });
    if (!contract) {
      return res.status(409).json({
        message: "This deal already has a contract. Replace it instead."
      });
    }
    res.status(201).json(contract);
  } catch (err) {
    console.error("ATTACH CONTRACT ERROR:", err);
    res.status(500).json({ message: "Failed to attach contract" });
  }
};

export const updateContract = async (req, res) => {
  try {
    if (invalidFileUrl(req.body)) {
      return res.status(400).json({
        message: "Contract file URL must start with http:// or https://"
      });
    }
    const c = await updateContractDB(req.user.id, req.params.id, buildPayload(req.body));
    if (!c) return res.status(404).json({ message: "Contract not found" });
    res.json(c);
  } catch (err) {
    console.error("UPDATE CONTRACT ERROR:", err);
    res.status(500).json({ message: "Failed to update contract" });
  }
};

export const setContractStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Status must be one of: awaiting_signature, signed, expired"
      });
    }
    const c = await setStatusDB(req.user.id, req.params.id, status);
    if (!c) return res.status(404).json({ message: "Contract not found" });
    res.json(c);
  } catch (err) {
    console.error("SET CONTRACT STATUS ERROR:", err);
    res.status(500).json({ message: "Failed to update contract status" });
  }
};

export const setContractSignature = async (req, res) => {
  try {
    const { signature_status } = req.body;
    if (!SIGNATURES.includes(signature_status)) {
      return res.status(400).json({
        message: "Signature status must be one of: unsigned, awaiting, signed"
      });
    }
    const c = await setSignatureDB(req.user.id, req.params.id, signature_status);
    if (!c) return res.status(404).json({ message: "Contract not found" });
    res.json(c);
  } catch (err) {
    console.error("SET CONTRACT SIGNATURE ERROR:", err);
    res.status(500).json({ message: "Failed to update signature status" });
  }
};

export const removeContract = async (req, res) => {
  try {
    const removed = await deleteContractDB(req.user.id, req.params.id);
    if (!removed) return res.status(404).json({ message: "Contract not found" });
    res.json({ message: "Contract removed" });
  } catch (err) {
    console.error("DELETE CONTRACT ERROR:", err);
    res.status(500).json({ message: "Failed to remove contract" });
  }
};

