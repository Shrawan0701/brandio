import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { fetchPublicMediaKit } from "../lib/api";
import { formatCompactNumber, formatPlatform, visibleMetrics } from "../utils/portfolio";

export default function PublicMediaKit() {
  const { username } = useParams();
  const [kit, setKit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPublicMediaKit(username)
      .then(setKit)
      .catch((err) => {
        setError(err.response?.data?.message || "This media kit is not available.");
      })
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return <div className="mk-page"><div className="mk-empty">Loading media kit...</div></div>;
  if (error) return <div className="mk-page"><div className="mk-empty">{error}</div></div>;
  if (kit?.published === false) {
    return (
      <div className="mk-page">
        <Helmet><title>Media Kit not published - Brandio</title></Helmet>
        <div className="mk-empty">Media Kit not published.</div>
      </div>
    );
  }

  const { creator, metrics = [], services = [], rates = [], brands = [], portfolio = [], brandExperience, collaborationPreferences } = kit;
  const socials = Object.entries(creator.social_profiles || creator.social_links || {}).filter(([, url]) => url);
  const publicHandle = creator.public_slug || creator.username;

  return (
    <div className="mk-page">
      <Helmet><title>{creator.display_name} Media Kit - Brandio</title></Helmet>

      <section className="mk-hero">
        <div className="mk-hero-copy">
          <div className="mk-brand">Creator profile</div>
          <h1>{creator.display_name}</h1>
          <p className="mk-handle">@{publicHandle}</p>
          <p className="mk-headline">{creator.headline || creator.niche || "Creator media kit"}</p>
          {creator.bio && <p className="mk-bio">{creator.bio}</p>}
          <div className="mk-tags">
            {creator.niche && <span><small>Niche</small>{creator.niche}</span>}
            {creator.location && <span><small>Location</small>{creator.location}</span>}
            {creator.languages && <span><small>Languages</small>{creator.languages}</span>}
          </div>
          <div className="mk-actions">
            {creator.show_cta && <Link to={`/${publicHandle}/work-with-me`}>Work with me</Link>}
            {socials.map(([name, url]) => (
              <a key={name} href={url} target="_blank" rel="noreferrer">{name}</a>
            ))}
          </div>
        </div>
        <div className="mk-photo-wrap">
          <img src={creator.profile_image_url || `https://ui-avatars.com/api/?name=${creator.display_name}`} alt={creator.display_name} />
        </div>
      </section>

      {metrics.length > 0 && (
        <section className="mk-section mk-stats">
          {metrics.flatMap(normalizeAudienceMetric).map((metric, index) => (
            <div key={`${metric.label}-${index}`}><strong>{metric.value}</strong><span>{metric.label}</span></div>
          ))}
        </section>
      )}

      {services.length > 0 && (
        <section className="mk-section">
          <h2>Collaboration options</h2>
              <div className="mk-card-list">
                {services.map((service, index) => (
                  <article key={`${service.name}-${index}`}>
                    <h3>{service.name}</h3>
                    {service.description && <p>{service.description}</p>}
                    {service.show_price && service.starting_price && <p className="mk-price">From {service.currency || "₹"}{service.starting_price}</p>}
                  </article>
                ))}
              </div>
        </section>
      )}

      {brandExperience && (
        <section className="mk-section">
          <h2>Brand experience</h2>
          <div className="mk-stats compact">
            <div><strong>{brandExperience.total_collaborations || 0}</strong><span>Brand collaborations</span></div>
            <div><strong>{brandExperience.paid || 0}</strong><span>Paid collaborations</span></div>
            <div><strong>{brandExperience.affiliate || 0}</strong><span>Affiliate collaborations</span></div>
            <div><strong>{brandExperience.gifted || 0}</strong><span>Gifted collaborations</span></div>
          </div>
          {(brandExperience.brands || []).length > 0 && <><h3>Worked with</h3><div className="mk-brand-grid">{brandExperience.brands.map((brand) => <span key={brand.brand_name}>{brand.brand_name}</span>)}</div></>}
        </section>
      )}

      {!brandExperience && brands.length > 0 && (
        <section className="mk-section">
          <h2>Selected brands</h2>
          <div className="mk-brand-grid">
            {brands.map((brand, index) => <span key={`${brand.name}-${index}`}>{brand.name}</span>)}
          </div>
        </section>
      )}

      {portfolio.length > 0 && (
        <section className="mk-section">
          <h2>Selected work</h2>
          <div className="mk-portfolio">
            {portfolio.map((item, index) => {
              const itemMetrics = visibleMetrics(item.metrics);
              return (
                <article key={`${item.campaign_title || item.brand_name}-${index}`} className="mk-work">
                  <div className="mk-work-thumb">
                    {item.thumbnail_url ? <img src={item.thumbnail_url} alt={item.campaign_title || item.brand_name} /> : <span>{item.brand_name?.charAt(0)}</span>}
                  </div>
                  <div>
                    <span>{formatPlatform(item)}</span>
                    <h3>{item.campaign_title || item.brand_name}</h3>
                    <p>{item.creator_notes || item.deliverables?.join(", ")}</p>
                    {item.content_url && <a href={item.content_url} target="_blank" rel="noreferrer">View content</a>}
                    {itemMetrics.length > 0 && (
                      <div className="mk-work-metrics">
                        {itemMetrics.slice(0, 3).map((m) => (
                          <strong key={m.key}>{m.key === "engagement_rate" ? `${m.value}%` : formatCompactNumber(m.value)} <small>{m.label}</small></strong>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {collaborationPreferences?.work_types?.length > 0 && (
        <section className="mk-section">
          <h2>Open to</h2>
          <div className="mk-brand-grid">
            {collaborationPreferences.work_types.map((type) => <span key={type}>{type}</span>)}
          </div>
          {collaborationPreferences.categories && <p>{collaborationPreferences.categories}</p>}
        </section>
      )}

      <section className="mk-footer-cta">
        <h2>Ready to collaborate?</h2>
        <Link to={`/${publicHandle}/work-with-me`}>Work with me</Link>
      </section>
    </div>
  );
}

function normalizeAudienceMetric(metric) {
  if (metric.label && metric.value) return [{ label: metric.label, value: metric.value }];
  const platform = metric.platform || "Platform";
  const rows = [];
  if (metric.followers) rows.push({ value: metric.followers, label: `${platform} followers` });
  if (metric.subscribers) rows.push({ value: metric.subscribers, label: `${platform} subscribers` });
  if (metric.average_reel_views) rows.push({ value: metric.average_reel_views, label: "Avg Reel views" });
  if (metric.average_story_views) rows.push({ value: metric.average_story_views, label: "Avg Story views" });
  if (metric.average_views) rows.push({ value: metric.average_views, label: "Avg views" });
  if (metric.engagement_rate) rows.push({ value: metric.engagement_rate, label: "Engagement" });
  if (metric.monthly_reach) rows.push({ value: metric.monthly_reach, label: "Monthly reach" });
  return rows;
}
