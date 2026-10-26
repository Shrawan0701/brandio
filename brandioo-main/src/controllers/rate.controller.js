import { calculateRateDB, listQuotesDB, saveQuoteDB } from "../services/rate.service.js";
import { explainRate } from "../services/rate-ai.service.js";

const text = (value, max = 300) => String(value || "").trim().slice(0, max);
const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const buildInput = (body = {}) => ({
  platform: text(body.platform, 80),
  followers: num(body.followers),
  average_views: num(body.average_views),
  engagement_rate: num(body.engagement_rate),
  deliverables: num(body.deliverables),
  content_type: text(body.content_type, 80),
  usage_rights: text(body.usage_rights, 120),
  paid_ad_usage: body.paid_ad_usage === true,
  exclusivity: body.exclusivity === true,
  turnaround: text(body.turnaround, 80),
  brand_name: text(body.brand_name, 150),
  currency: text(body.currency, 3)
});

export const calculateRate = async (req, res) => {
  try {
    const input = buildInput(req.body);
    const result = await calculateRateDB(req.user.id, input);
    const ai = await explainRate(result);
    res.json({ ...result, ai });
  } catch (err) {
    console.error("CALCULATE RATE ERROR:", err);
    res.status(500).json({ message: "Could not calculate quote" });
  }
};

export const saveQuote = async (req, res) => {
  try {
    const quote = await saveQuoteDB(
      req.user.id,
      req.body.input || {},
      req.body.result || {},
      text(req.body.negotiation_message, 3000)
    );
    res.status(201).json(quote);
  } catch (err) {
    console.error("SAVE QUOTE ERROR:", err);
    res.status(500).json({ message: "Could not save quote" });
  }
};

export const listQuotes = async (req, res) => {
  try {
    const quotes = await listQuotesDB(req.user.id);
    res.json({ quotes });
  } catch (err) {
    console.error("LIST QUOTES ERROR:", err);
    res.status(500).json({ message: "Could not load quotes" });
  }
};
