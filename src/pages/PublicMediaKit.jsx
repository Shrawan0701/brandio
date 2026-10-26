import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { fetchPublicMediaKit } from "../lib/api";
import { formatAmount, formatCompactNumber, formatPlatform, visibleMetrics } from "../utils/portfolio";

export default function PublicMediaKit() {
  const { username } = useParams();
  const [kit, setKit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetchPublicMediaKit(username)
      .then((data) => { if (active) setKit(data); })
      .catch((err) => { if (active) setError(err.response?.data?.message || "This media kit is not available."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [username]);

  if (loading || error || !kit?.creator || kit.published === false) {
    const unavailable = error || kit?.published === false || (!loading && !kit?.creator);
    return <div className="creator-site cs-state">
      <Helmet><title>{unavailable ? "Media kit unavailable" : "Loading media kit"} - Brandio</title></Helmet>
      <div className="cs-state-mark" aria-hidden="true">✳</div>
      <h1>{loading ? "A little creativity, on its way." : "This page is taking a break."}</h1>
      <p role="status">{loading ? "Loading creator profile…" : error || "This media kit is not published."}</p>
      {!loading && <Link to="/" className="cs-text-link">Visit Brandio <Arrow /></Link>}
    </div>;
  }

  const { creator, metrics = [], services = [], brands = [], portfolio = [], brandExperience, collaborationPreferences, visibility = {} } = kit;
  const name = creator.display_name || creator.username || "Creator";
  const publicHandle = creator.public_slug || creator.username || username;
  const contactPath = `/${publicHandle}/work-with-me`;
  const showContact = creator.show_cta !== false;
  const showAbout = visibility.about !== false;
  const showWork = visibility.selected_work !== false && portfolio.length > 0;
  const showServices = visibility.services !== false && services.length > 0;
  const audience = visibility.audience === false ? [] : metrics.flatMap(normalizeAudienceMetric);
  const partners = visibility.brand_experience === false ? [] : (brandExperience?.brands?.length ? brandExperience.brands.map((brand) => brand.brand_name) : brands.map((brand) => brand.name)).filter(Boolean);
  const preferences = visibility.collaboration_preferences === false ? null : collaborationPreferences;
  const socials = Object.entries(creator.social_profiles || creator.social_links || {})
    .map(([platform, url]) => ({ platform, url: externalUrl(url) }))
    .filter(({ url }) => url);

  return (
    <div className="creator-site" id="creator-top">
      <Helmet>
        <title>{name} — Creator portfolio | Brandio</title>
        {showAbout && creator.bio && <meta name="description" content={creator.bio} />}
      </Helmet>
      <a className="cs-skip" href="#creator-content">Skip to content</a>

      <header className="cs-topbar cs-container">
        <a className="cs-wordmark" href="#creator-top"><span className="cs-index-mark" aria-hidden="true" /><span>THE CREATOR INDEX<small>Personal profile / Media kit</small></span></a>
        <nav aria-label="Creator navigation">
          {showWork && <a href="#creator-work">Work</a>}
          {audience.length > 0 && <a href="#creator-audience">Audience</a>}
          {showServices && <a href="#creator-services">Services</a>}
          {showContact && <Link to={contactPath} className="cs-nav-contact">Send a brief <Arrow /></Link>}
        </nav>
      </header>

      <div id="creator-content">
        <section className="cs-hero cs-container" aria-labelledby="creator-name">
          <div className="cs-masthead"><div className="cs-masthead-top"><span>PROFILE / @{publicHandle}</span><span>CREATIVITY, IN PERSON.</span></div><h1 id="creator-name">{name}</h1></div>
          <div className="cs-portrait-scene">
            <div className="cs-portrait"><CreatorImage src={creator.profile_image_url} name={name} /></div>
            <div className="cs-photo-caption"><span>01 / THE PERSON</span><span>{initials(name)}</span></div>
          </div>
          <div className="cs-hero-copy">
            <span className="cs-section-label">INTRODUCTION</span>
            {showAbout && <>
              <p className="cs-headline">{creator.headline || creator.niche || "Creator"}</p>
              {creator.bio && <p className="cs-bio">{creator.bio}</p>}
            </>}
            <div className="cs-hero-actions">
              {showContact && <Link className="cs-button" to={contactPath}>Work with me <Arrow /></Link>}
              {showWork && <a className="cs-text-link" href="#creator-work">Explore my work <span aria-hidden="true">↓</span></a>}
            </div>
            {socials.length > 0 && <div className="cs-socials" aria-label="Social profiles"><span className="cs-section-label">FIND ME ON</span><div className="cs-social-links">{socials.map(({ platform, url }) => <a key={platform} href={url} target="_blank" rel="noopener noreferrer"><SocialIcon platform={platform} /><span>{platformLabel(platform)}</span><Arrow /></a>)}</div></div>}
          </div>
          {showAbout && <dl className="cs-profile-details">
            {creator.niche && <div><dt>01 / FOCUS</dt><dd>{creator.niche}</dd></div>}
            {creator.location && <div><dt>02 / BASED IN</dt><dd>{creator.location}</dd></div>}
            {creator.languages && <div><dt>03 / LANGUAGES</dt><dd>{creator.languages}</dd></div>}
          </dl>}
        </section>

        {(partners.length > 0 || (visibility.brand_experience !== false && brandExperience)) && <section className="cs-partners cs-container" aria-label="Brand experience">
          <div className="cs-partner-caption"><span className="cs-section-label">A FEW PAST COLLABORATORS</span>
            {brandExperience && <p>{experienceSummary(brandExperience)}</p>}
          </div>
          {partners.length > 0 && <div className="cs-partner-names">{partners.map((brand, index) => <span key={`${brand}-${index}`}>{brand}</span>)}</div>}
        </section>}

        {showWork && <WorkCollection key={publicHandle} portfolio={portfolio} />}

        {audience.length > 0 && <section className="cs-audience" id="creator-audience" aria-labelledby="creator-audience-title">
          <div className="cs-container cs-audience-inner">
            <div className="cs-audience-intro"><span className="cs-section-label">02 / THE AUDIENCE</span><h2 id="creator-audience-title">The other side<br />of the screen.</h2><p>A snapshot of the people watching,<br />following, and engaging.</p><span className="cs-report-label">CREATOR-REPORTED METRICS</span></div>
            <div className="cs-audience-numbers">{audience.map((metric, index) => <div className={`cs-metric ${index === 0 ? "cs-metric-lead" : ""}`} key={`${metric.label}-${index}`}><span>{metric.platform}</span><strong>{metric.percentage ? `${metric.value}%` : formatMetricValue(metric.value)}</strong><p>{metric.label}</p></div>)}</div>
          </div>
        </section>}

        {showServices && <section className="cs-services cs-container cs-section" id="creator-services" aria-labelledby="creator-services-title">
          <SectionHeading number="03" label="COLLABORATION MENU" title="What we can make." id="creator-services-title" aside="Formats, starting points, and a direct line to your next collaboration." />
          <div className="cs-service-list">{services.map((service, index) => <article key={`${service.name}-${index}`}>
            <span className="cs-service-index">{String(index + 1).padStart(2, "0")}</span>
            <div><h3>{service.name || "Creative collaboration"}</h3>{service.description && <p>{service.description}</p>}</div>
            <div className="cs-service-end">{service.show_price && service.starting_price !== "" && service.starting_price != null && <span className="cs-service-price"><small>Starting at</small>{formatAmount(service.starting_price, service.currency || "₹")}</span>}{showContact && <Link to={contactPath} className="cs-circle-link" aria-label={`Enquire about ${service.name || "creative collaboration"}`}><Arrow /></Link>}</div>
          </article>)}</div>
        </section>}

        {(preferences?.work_types?.length > 0 || preferences?.categories) && <section className="cs-preferences cs-container" aria-labelledby="creator-preferences-title">
          <div><span className="cs-section-label">WORKING TOGETHER</span><h2 id="creator-preferences-title">Also on the table.</h2></div>
          <div className="cs-preference-details"><div className="cs-preference-tags">{(preferences.work_types || []).map((type) => <span key={type}><span aria-hidden="true">+</span>{type}</span>)}</div>{preferences.categories && <p>{preferences.categories}</p>}</div>
        </section>}

        {showContact && <section className="cs-contact" id="creator-contact" aria-labelledby="creator-contact-title"><div className="cs-container cs-contact-inner">
          <div><span className="cs-section-label">YOUR IDEA. NEXT CHAPTER.</span><h2 id="creator-contact-title">Have a brief?</h2><p>Tell me what you’re thinking.</p></div>
          <Link to={contactPath} className="cs-contact-link"><span>Work with me</span><Arrow /></Link>
        </div></section>}
      </div>

      <footer className="cs-footer cs-container"><a href="#creator-top">{name} <span aria-hidden="true">↑</span></a><span>END OF PROFILE / @{publicHandle}</span><Link to="/" className="cs-brandio">Published with <img src="/brandio-logo.png" alt="" />Brandio <Arrow /></Link></footer>
    </div>
  );
}

function SectionHeading({ number, label, title, aside, id }) {
  return <header className="cs-section-heading"><div><span className="cs-section-label"><span className="cs-section-number">{number} /</span>{label}</span><h2 id={id}>{title}</h2></div><p>{aside}</p></header>;
}

function CreatorImage({ src, name, className = "" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return src && !failed ? <img className={className} src={src} alt={name} onError={() => setFailed(true)} /> : <span className={`cs-image-fallback ${className}`} aria-label={name}>{initials(name)}</span>;
}

function WorkCollection({ portfolio }) {
  const [view, setView] = useState("list");
  const [visibleCount, setVisibleCount] = useState(5);
  const visibleProjects = portfolio.slice(0, visibleCount);
  const remainingCount = portfolio.length - visibleProjects.length;
  return <section className="cs-work-section" id="creator-work" aria-labelledby="creator-work-title"><div className="cs-container">
    <header className="cs-work-heading"><div><span className="cs-section-label">01 / SELECTED PROJECTS</span><h2 id="creator-work-title">Work, in the wild.<sup>{String(portfolio.length).padStart(2, "0")}</sup></h2></div>
      <div className="cs-view-switch" role="group" aria-label="Project layout">{["gallery", "list"].map((mode) => <button key={mode} type="button" aria-pressed={view === mode} aria-label={`${mode === "gallery" ? "Gallery" : "List"} view`} onClick={() => setView(mode)}>{mode === "gallery" ? <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 1h5v5H1zm9 0h5v5h-5zM1 10h5v5H1zm9 0h5v5h-5z" /></svg> : <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 2h14M1 8h14M1 14h14" /></svg>}<span>{mode === "gallery" ? "Gallery" : "List"}</span></button>)}</div>
    </header>
    <div id="creator-projects" className={`cs-work-grid ${view === "list" ? "is-list" : ""}`}>{visibleProjects.map((item, index) => <WorkProject item={item} index={index} key={item.id || index} />)}</div>
    {remainingCount > 0 && <div className="cs-load-more-wrap"><button type="button" className="cs-load-more" aria-controls="creator-projects" onClick={() => setVisibleCount((count) => count + 5)}>Load more <span aria-hidden="true">+{Math.min(5, remainingCount)}</span></button></div>}
    <div className="cs-work-colophon"><span role="status">SHOWING {visibleProjects.length} OF {portfolio.length} PROJECTS</span><a href="#creator-top">BACK TO PROFILE ↑</a></div>
  </div></section>;
}

function WorkProject({ item, index }) {
  const [failed, setFailed] = useState(false);
  const title = item.campaign_title || item.brand_name || "Creative project";
  const url = externalUrl(item.content_url);
  const itemMetrics = visibleMetrics(item.metrics);
  const visual = <><div className={`cs-project-visual cs-project-tone-${index % 4}`}>
    {item.thumbnail_url && !failed ? <img src={item.thumbnail_url} alt={title} loading="lazy" onError={() => setFailed(true)} /> : <div className="cs-project-art"><span className="cs-art-caption">PROJECT FILE / {String(index + 1).padStart(2, "0")}</span><span className="cs-art-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><strong>{item.brand_name || title}</strong><span className="cs-art-bottom"><span>{item.deliverables?.join(" + ") || "BRAND COLLABORATION"}</span><span aria-hidden="true">{url ? "↗" : `/${String(index + 1).padStart(2, "0")}`}</span></span></div>}
    <span className="cs-project-platform">{formatPlatform(item)}</span>
    {url && <span className="cs-project-open"><Arrow /></span>}
  </div></>;
  return <article className="cs-project">
    {url ? <a className="cs-project-image-link" href={url} target="_blank" rel="noopener noreferrer" aria-label={`View ${title}`}>{visual}</a> : visual}
    <div className="cs-project-info"><span className="cs-project-index">/{String(index + 1).padStart(2, "0")}</span><div>{item.brand_name !== title && <span>{item.brand_name}</span>}<h3>{title}</h3></div>{url && <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${title}`}><Arrow /></a>}</div>
    {(item.creator_notes || item.deliverables?.length > 0) && <p className="cs-project-description">{item.creator_notes || item.deliverables.join(", ")}</p>}
    {itemMetrics.length > 0 && <div className="cs-project-metrics">{itemMetrics.slice(0, 3).map((metric) => <span key={metric.key}><strong>{metric.key === "engagement_rate" ? `${metric.value}%` : formatCompactNumber(metric.value)}</strong> {metric.label}</span>)}</div>}
  </article>;
}

function Arrow() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" /></svg>; }
function SocialIcon({ platform }) {
  const key = platform.toLowerCase();
  const paths = {
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".7" fill="currentColor" /></>,
    youtube: <><rect x="2" y="5" width="20" height="14" rx="4" /><path d="m10 9 5 3-5 3Z" /></>,
    tiktok: <path d="M14 3v12a4 4 0 1 1-4-4M14 3c0 4 3 6 6 6" />,
    x: <><path d="m4 3 16 18h-4L4 7V3h4l12 14v4M20 3 4 21" /></>,
    linkedin: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M7 10v7m0-10v.1M11 17v-7m0 3c0-4 6-4 6 0v4" /></>
  };
  return <svg className="cs-social-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[key === "twitter" ? "x" : key] || <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18Z" /></>}</svg>;
}

function initials(name) { return String(name).trim().split(/\s+/).map((word) => word[0]).slice(0, 2).join("").toUpperCase(); }
function platformLabel(key) { return { instagram: "Instagram", youtube: "YouTube", tiktok: "TikTok", x: "X / Twitter", twitter: "X / Twitter", linkedin: "LinkedIn", other: "Website" }[key.toLowerCase()] || key; }
function externalUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const input = value.trim();
  if (!/^https?:\/\//i.test(input) && !/^[\w-]+(\.[\w-]+)+([/:?#]|$)/.test(input)) return null;
  try { const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`); return ["http:", "https:"].includes(url.protocol) ? url.href : null; } catch { return null; }
}
function formatMetricValue(value) {
  const number = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(number) ? formatCompactNumber(number) : value;
}
function normalizeAudienceMetric(metric) {
  if (metric.label && metric.value !== undefined && metric.value !== "") return [{ label: metric.label, value: metric.value, platform: metric.platform || "", percentage: /engagement|%/.test(metric.label.toLowerCase()) }];
  return [["followers", "Followers"], ["subscribers", "Subscribers"], ["average_reel_views", "Average Reel views"], ["average_story_views", "Average Story views"], ["average_views", "Average views"], ["engagement_rate", "Engagement rate"], ["monthly_reach", "Monthly reach"]]
    .filter(([key]) => metric[key] !== undefined && metric[key] !== null && metric[key] !== "")
    .map(([key, label]) => ({ value: metric[key], label, platform: metric.platform || "", percentage: key === "engagement_rate" }));
}
function experienceSummary(data) {
  return [[data.total_collaborations, "collaborations"], [data.unique_brands, "brand partners"], [data.paid, "paid"], [data.affiliate, "affiliate"], [data.gifted, "gifted"], [data.hybrid, "hybrid"], [data.repeat_brands, "repeat partners"]].filter(([value]) => Number(value) > 0).map(([value, label]) => `${value} ${label}`).join(" · ");
}
