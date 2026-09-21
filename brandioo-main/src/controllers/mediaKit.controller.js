import {
  getMediaKitEditorDB,
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

const listOfStrings = (value, limit = 20, max = 80) => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => text(item, max)).filter(Boolean).slice(0, limit);
};

const boolMap = (value = {}, allowed = []) => {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return Object.fromEntries(allowed.map((key) => [key, source[key] !== false]));
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
  public_brands: listOfObjects(body.public_brands, [["name", 100]], 24),
  social_profiles: {
    instagram: text(body.social_profiles?.instagram, 240),
    youtube: text(body.social_profiles?.youtube, 240),
    tiktok: text(body.social_profiles?.tiktok, 240),
    x: text(body.social_profiles?.x, 240),
    other: text(body.social_profiles?.other, 240)
  },
  audience_public: body.audience_public !== false,
  audience_metrics: listOfObjects(body.audience_metrics, [
    ["platform", 40],
    ["followers", 40],
    ["subscribers", 40],
    ["average_reel_views", 40],
    ["average_story_views", 40],
    ["average_views", 40],
    ["engagement_rate", 40],
    ["monthly_reach", 40]
  ], 8),
  collaboration_options: listOfObjects(body.collaboration_options, [
    ["name", 100],
    ["description", 220],
    ["starting_price", 40],
    ["currency", 12],
    ["show_price", 8]
  ], 16).map((item) => ({ ...item, show_price: item.show_price === "true" || item.show_price === true })),
  selected_portfolio_ids: Array.isArray(body.selected_portfolio_ids)
    ? body.selected_portfolio_ids.map((id) => Number(id)).filter(Number.isFinite).slice(0, 12)
    : [],
  brand_experience_public: body.brand_experience_public !== false,
  collaboration_preferences_public: body.collaboration_preferences_public !== false,
  collaboration_preferences: {
    work_types: listOfStrings(body.collaboration_preferences?.work_types, 20, 80),
    categories: text(body.collaboration_preferences?.categories, 240)
  },
  visibility: boolMap(body.visibility, [
    "about",
    "audience",
    "services",
    "selected_work",
    "brand_experience",
    "testimonials",
    "collaboration_preferences"
  ])
});

export const getMediaKit = async (req, res) => {
  try {
    const kit = await getMediaKitEditorDB(req.user.id);
    if (!kit) return res.status(404).json({ message: "Media kit not found" });
    res.json(kit);
  } catch (err) {
    console.error("GET MEDIA KIT ERROR:", err);
    res.status(500).json({ message: "Could not load media kit" });
  }
};

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
