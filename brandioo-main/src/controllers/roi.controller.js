import { getRoiOverview } from "../services/roi.service.js";

/* GET /api/roi — aggregate ROI over completed deals (all plans). */
export const getRoi = async (req, res) => {
  try {
    res.json(await getRoiOverview(req.user.id));
  } catch (err) {
    console.error("GET ROI ERROR:", err);
    res.status(500).json({ message: "Failed to load ROI" });
  }
};
