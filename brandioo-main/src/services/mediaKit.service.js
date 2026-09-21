import pool from "../config/db.js";
import { getPublicCreatorBySlug } from "./publicProfile.service.js";

const defaultKit = {
  enabled: false,
  display_name: "",
  headline: "",
  bio: "",
  niche: "",
  location: "",
  languages: "",
  categories: "",
  show_cta: true,
  show_rates: false,
  metrics: [],
  services: [],
  rates: [],
  public_brands: [],
  audience_public: true,
  audience_metrics: [],
  collaboration_options: [],
  selected_portfolio_ids: [],
  brand_experience_public: true,
  collaboration_preferences_public: true,
  collaboration_preferences: {
    work_types: [],
    categories: ""
  },
  visibility: {
    about: true,
    audience: true,
    services: true,
    selected_work: true,
    brand_experience: true,
    testimonials: false,
    collaboration_preferences: true
  },
  social_profiles: {}
};

export const normalizeMediaKit = (value = {}) => ({
  ...defaultKit,
  ...(value && typeof value === "object" && !Array.isArray(value) ? value : {})
});

export const updateMediaKitDB = async (userId, mediaKit) => {
  const next = normalizeMediaKit(mediaKit);
  const { rows } = await pool.query(
    `UPDATE users
     SET media_kit = $1, media_kit_enabled = $2
     WHERE id=$3
     RETURNING id, username, email, plan, plan_expiry, profile_image_url,
       social_links, country_code, public_slug, media_kit_enabled, media_kit`,
    [next, next.enabled === true, userId]
  );
  return rows[0];
};

export const getMediaKitEditorDB = async (userId) => {
  const { rows } = await pool.query(
    `SELECT id, username, email, profile_image_url, social_links, public_slug,
      media_kit_enabled, media_kit
     FROM users WHERE id=$1`,
    [userId]
  );
  const user = rows[0];
  if (!user) return null;
  const kit = normalizeMediaKit(user.media_kit);
  const [portfolio, brandExperience] = await Promise.all([
    getMediaKitPortfolioDB(userId),
    getBrandExperienceDB(userId)
  ]);
  return {
    creator: {
      username: user.username,
      public_slug: user.public_slug || user.username,
      profile_image_url: user.profile_image_url,
      social_links: user.social_links || {}
    },
    media_kit: kit,
    portfolio,
    brandExperience
  };
};

const getMediaKitPortfolioDB = async (userId) => {
  const { rows } = await pool.query(
    `SELECT
       p.id,
       p.campaign_title,
       p.deliverables,
       p.content_url,
       p.thumbnail_url,
       p.metrics,
       p.creator_notes,
       p.is_public,
       p.is_featured,
       d.brand_name,
       d.platform,
       d.platform_custom,
       d.deal_type
     FROM portfolio_items p
     JOIN deals d ON d.id = p.deal_id
     WHERE p.user_id=$1
     ORDER BY p.is_featured DESC, p.created_at DESC`,
    [userId]
  );
  return rows;
};

export const getBrandExperienceDB = async (userId) => {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*)::int AS total_collaborations,
       COUNT(DISTINCT brand_name)::int AS unique_brands,
       COUNT(DISTINCT brand_name) FILTER (
         WHERE brand_name IN (
           SELECT brand_name FROM deals WHERE user_id=$1 GROUP BY brand_name HAVING COUNT(*) > 1
         )
       )::int AS repeat_brands,
       COUNT(*) FILTER (WHERE COALESCE(deal_type, 'paid') = 'paid')::int AS paid,
       COUNT(*) FILTER (WHERE COALESCE(deal_type, 'paid') IN ('affiliate', 'commission'))::int AS affiliate,
       COUNT(*) FILTER (WHERE COALESCE(deal_type, 'paid') IN ('gifted', 'barter'))::int AS gifted,
       COUNT(*) FILTER (WHERE COALESCE(deal_type, 'paid') = 'hybrid')::int AS hybrid
     FROM deals
     WHERE user_id=$1`,
    [userId]
  );
  const brands = await pool.query(
    `SELECT brand_name, COUNT(*)::int AS collaborations
     FROM deals
     WHERE user_id=$1 AND NULLIF(TRIM(brand_name), '') IS NOT NULL
     GROUP BY brand_name
     ORDER BY collaborations DESC, brand_name ASC
     LIMIT 16`,
    [userId]
  );
  const platforms = await pool.query(
    `SELECT COALESCE(NULLIF(platform_custom, ''), platform, 'Other') AS platform,
       COUNT(*)::int AS collaborations
     FROM deals
     WHERE user_id=$1
     GROUP BY 1
     ORDER BY collaborations DESC
     LIMIT 8`,
    [userId]
  );
  return { ...rows[0], brands: brands.rows, platforms: platforms.rows };
};

export const getPublicMediaKitDB = async (username) => {
  const user = await getPublicCreatorBySlug(username);
  if (!user) return null;

  const kit = normalizeMediaKit(user.media_kit);
  const published = user.media_kit_enabled === true || kit.enabled === true;

  if (!published) {
    return {
      published: false,
      reason: "unpublished",
      creator: {
        public_slug: user.public_slug
      }
    };
  }

  const selectedIds = Array.isArray(kit.selected_portfolio_ids)
    ? kit.selected_portfolio_ids.map((id) => Number(id)).filter(Boolean)
    : [];
  const portfolio = kit.visibility?.selected_work === false
    ? { rows: [] }
    : await pool.query(
    `SELECT
       p.id,
       p.campaign_title,
       p.deliverables,
       p.completion_date::text AS completion_date,
       p.content_url,
       p.thumbnail_url,
       p.metrics,
       p.creator_notes,
       d.brand_name,
       d.platform,
       d.platform_custom
     FROM portfolio_items p
     JOIN deals d ON d.id = p.deal_id
     WHERE p.user_id=$1 AND p.is_public = TRUE
       ${selectedIds.length ? "AND p.id = ANY($2::int[])" : ""}
     ORDER BY p.is_featured DESC,
       COALESCE(p.completion_date, d.posting_date, d.created_at::date) DESC NULLS LAST,
       p.created_at DESC`,
    selectedIds.length ? [user.id, selectedIds] : [user.id]
  );
  const brandExperience = kit.brand_experience_public !== false && kit.visibility?.brand_experience !== false
    ? await getBrandExperienceDB(user.id)
    : null;

  return {
    published: true,
    creator: {
      username: user.username,
      public_slug: user.public_slug,
      profile_image_url: user.profile_image_url,
      social_links: user.social_links || {},
      display_name: kit.display_name || user.username,
      headline: kit.headline,
      bio: kit.bio,
      niche: kit.niche,
      location: kit.location,
      languages: kit.languages,
      categories: kit.categories,
      show_cta: kit.show_cta !== false,
      social_profiles: kit.social_profiles || user.social_links || {}
    },
    visibility: kit.visibility || defaultKit.visibility,
    metrics: kit.audience_public !== false && kit.visibility?.audience !== false
      ? (Array.isArray(kit.audience_metrics) && kit.audience_metrics.length ? kit.audience_metrics : kit.metrics)
      : [],
    services: kit.visibility?.services !== false
      ? (Array.isArray(kit.collaboration_options) && kit.collaboration_options.length ? kit.collaboration_options : kit.services)
      : [],
    rates: kit.show_rates === true && Array.isArray(kit.rates) ? kit.rates : [],
    brands: Array.isArray(kit.public_brands) ? kit.public_brands : [],
    brandExperience,
    collaborationPreferences: kit.visibility?.collaboration_preferences !== false && kit.collaboration_preferences_public !== false
      ? kit.collaboration_preferences
      : null,
    portfolio: portfolio.rows
  };
};
