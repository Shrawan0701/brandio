import { analyzeDealTerms } from "../services/deal-analyzer.service.js";

export const analyzeDeal = async (req, res) => {
  try {
    const text = String(req.body.text || "").trim();
    if (text.length < 40) {
      return res.status(400).json({ message: "Paste enough deal or contract text to analyze." });
    }
    if (text.length > 60000) {
      return res.status(400).json({ message: "Text is too long. Please analyze a shorter excerpt." });
    }

    const analysis = await analyzeDealTerms(text);
    res.json(analysis);
  } catch (err) {
    console.error("DEAL ANALYZER ERROR:", err);
    res.status(500).json({ message: "Could not analyze deal terms" });
  }
};
