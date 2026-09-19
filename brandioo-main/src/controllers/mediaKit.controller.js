import {
  getPublicMediaKitDB,
  normalizeMediaKit,
  updateMediaKitDB
} from "../services/mediaKit.service.js";

const text = (value, max = 500) => String(value || "").trim().slice(0, max);

const listOfObjects = (value, fields, limit = 12) => {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, limit)
    .map((item) => {
      const source = item && typeof item === "object" ? item : {};
      const next = {};
      for (const [field, max] of fields) next[field] = text(source[field], max);
      return next;
    })
    .filter((item) => Object.values(item).some(Boolean));
};

const buildMediaKit = (body = {}) => ({
  enabled: body.enabled === true,
  display_name: text(body.display_name, 100),
  headline: text(body.headline, 180),
  bio: text(body.bio, 1200),
  niche: text(body.niche, 120),
  location: text(body.location, 120),
  languages: text(body.languages, 120),
  categories: text(body.categories, 200),
  show_cta: body.show_cta !== false,
  show_rates: body.show_rates === true,
  metrics: listOfObjects(body.metrics, [["label", 60], ["value", 60]], 8),
  services: listOfObjects(body.services, [["name", 80], ["description", 160]], 12),
  rates: listOfObjects(body.rates, [["name", 80], ["price", 80]], 12),
  public_brands: listOfObjects(body.public_brands, [["name", 100]], 24)
});

export const getPublicMediaKit = async (req, res) => {
  try {
    const kit = await getPublicMediaKitDB(req.params.username);
    if (!kit) return res.status(404).json({ message: "Media kit not found" });
    if (kit.published === false) {
      return res.json({
        published: false,
        message: "Media Kit not published",
        creator: kit.creator
      });
    }
    res.json(kit);
  } catch (err) {
    console.error("GET PUBLIC MEDIA KIT ERROR:", err);
    res.status(500).json({ message: "Could not load media kit" });
  }
};

export const updateMediaKit = async (req, res) => {
  try {
    const user = await updateMediaKitDB(req.user.id, buildMediaKit(req.body));
    res.json({ ...user, media_kit: normalizeMediaKit(user.media_kit) });
  } catch (err) {
    console.error("UPDATE MEDIA KIT ERROR:", err);
    res.status(500).json({ message: "Could not update media kit" });
  }
};
