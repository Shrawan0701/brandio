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
  public_brands: []
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

  const portfolio = await pool.query(
    `SELECT
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
     ORDER BY p.is_featured DESC,
       COALESCE(p.completion_date, d.posting_date, d.created_at::date) DESC NULLS LAST,
       p.created_at DESC`,
    [user.id]
  );

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
      show_cta: kit.show_cta !== false
    },
    metrics: Array.isArray(kit.metrics) ? kit.metrics : [],
    services: Array.isArray(kit.services) ? kit.services : [],
    rates: kit.show_rates === true && Array.isArray(kit.rates) ? kit.rates : [],
    brands: Array.isArray(kit.public_brands) ? kit.public_brands : [],
    portfolio: portfolio.rows
  };
};
