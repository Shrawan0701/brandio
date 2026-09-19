import { getIntelligence } from "../services/intelligence.service.js";
import { getAiBrief } from "../services/ai-brief.service.js";
import pool from "../config/db.js";

/* =========================================================
   INTELLIGENCE · CONTROLLER (Pro only, like analytics)
   ========================================================= */

export const intelligence = async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT plan FROM users WHERE id=$1`, [req.user.id]);
    if (!rows.length || rows[0].plan !== "pro") {
      return res.status(403).json({ message: "Pro only feature" });
    }
    const data = await getIntelligence(req.user.id);
    res.json(data);
  } catch (err) {
    console.error("INTELLIGENCE ERROR:", err);
    res.status(500).json({ message: "Failed to load intelligence" });
  }
};

/* AI-written brief over the same payload — Pro only. Falls back
   to a deterministic rules brief when no OpenAI key is set. */
export const aiBrief = async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT plan FROM users WHERE id=$1`, [req.user.id]);
    if (!rows.length || rows[0].plan !== "pro") {
      return res.status(403).json({ message: "Pro only feature" });
    }
    const brief = await getAiBrief(req.user.id);
    res.json(brief);
  } catch (err) {
    console.error("AI BRIEF ERROR:", err);
    res.status(500).json({ message: "Failed to generate brief" });
  }
};

