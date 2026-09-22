import { getIntelligence } from "../services/intelligence.service.js";
import { getAiBrief } from "../services/ai-brief.service.js";

export const intelligence = async (req, res) => {
  try {
    const data = await getIntelligence(req.user.id);
    res.json(data);
  } catch (err) {
    console.error("INTELLIGENCE ERROR:", err);
    res.status(500).json({ message: "Failed to load intelligence" });
  }
};

export const aiBrief = async (req, res) => {
  try {
    const brief = await getAiBrief(req.user.id);
    res.json(brief);
  } catch (err) {
    console.error("AI BRIEF ERROR:", err);
    res.status(500).json({ message: "Failed to generate brief" });
  }
};
