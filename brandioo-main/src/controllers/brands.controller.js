import { getBrandRelationshipsDB } from "../services/brands.service.js";

export const getBrandRelationships = async (req, res) => {
  try {
    const data = await getBrandRelationshipsDB(req.user.id);
    res.json(data);
  } catch (err) {
    console.error("GET BRAND RELATIONSHIPS ERROR:", err);
    res.status(500).json({ message: "Could not load brand relationships" });
  }
};
