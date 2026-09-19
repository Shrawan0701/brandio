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

  const { creator, metrics = [], services = [], rates = [], brands = [], portfolio = [] } = kit;
  const socials = Object.entries(creator.social_links || {}).filter(([, url]) => url);
  const publicHandle = creator.public_slug || creator.username;

  return (
    <div className="mk-page">
      <Helmet><title>{creator.display_name} Media Kit - Brandio</title></Helmet>

      <section className="mk-hero">
        <div className="mk-hero-copy">
          <div className="mk-brand">Brandio Media Kit</div>
          <h1>{creator.display_name}</h1>
          <p className="mk-headline">{creator.headline || creator.niche || "Creator media kit"}</p>
          {creator.bio && <p className="mk-bio">{creator.bio}</p>}
          <div className="mk-tags">
            {creator.niche && <span>{creator.niche}</span>}
            {creator.location && <span>{creator.location}</span>}
            {creator.languages && <span>{creator.languages}</span>}
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
          {metrics.map((metric, index) => (
            <div key={`${metric.label}-${index}`}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </div>
          ))}
        </section>
      )}

      {(services.length > 0 || rates.length > 0) && (
        <section className="mk-section mk-split">
          {services.length > 0 && (
            <div>
              <h2>Services</h2>
              <div className="mk-card-list">
                {services.map((service, index) => (
                  <article key={`${service.name}-${index}`}>
                    <h3>{service.name}</h3>
                    {service.description && <p>{service.description}</p>}
                  </article>
                ))}
              </div>
            </div>
          )}
          {rates.length > 0 && (
            <div>
              <h2>Starting rates</h2>
              <div className="mk-card-list">
                {rates.map((rate, index) => (
                  <article key={`${rate.name}-${index}`}>
                    <h3>{rate.name}</h3>
                    <p>{rate.price}</p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {brands.length > 0 && (
        <section className="mk-section">
          <h2>Selected brands</h2>
          <div className="mk-brand-grid">
            {brands.map((brand, index) => <span key={`${brand.name}-${index}`}>{brand.name}</span>)}
          </div>
        </section>
      )}

      {portfolio.length > 0 && (
        <section className="mk-section">
          <h2>Portfolio</h2>
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

      <section className="mk-footer-cta">
        <h2>Ready to collaborate?</h2>
        <Link to={`/${publicHandle}/work-with-me`}>Work with me</Link>
      </section>
    </div>
  );
}
