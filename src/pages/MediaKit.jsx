import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { fetchMediaKit, updateMediaKit, uploadProfilePhoto } from "../lib/api";
import { formatPlatform, visibleMetrics } from "../utils/portfolio";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../context/AuthContext";

const emptyKit = {
  enabled: false,
  display_name: "",
  headline: "",
  bio: "",
  niche: "",
  location: "",
  languages: "",
  categories: "",
  show_cta: true,
  social_profiles: {},
  audience_public: true,
  audience_metrics: [],
  collaboration_options: [],
  selected_portfolio_ids: [],
  brand_experience_public: true,
  collaboration_preferences_public: true,
  collaboration_preferences: { work_types: [], categories: "" },
  visibility: {
    about: true,
    audience: true,
    services: true,
    selected_work: true,
    brand_experience: true,
    testimonials: false,
    collaboration_preferences: true
  }
};

const workTypes = [
  "Paid collaborations",
  "UGC",
  "Affiliate partnerships",
  "Product campaigns",
  "Long-term partnerships",
  "Event appearances",
  "Content licensing"
];

export default function MediaKit() {
  const { showToast } = useToast();
  const { user, refreshUser } = useAuth();
  const [kit, setKit] = useState(emptyKit);
  const [creator, setCreator] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [brandExperience, setBrandExperience] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => {
    fetchMediaKit()
      .then((data) => {
        setCreator(data.creator);
        setKit({ ...emptyKit, ...(data.media_kit || {}) });
        setPortfolio(data.portfolio || []);
        setBrandExperience(data.brandExperience || null);
      })
      .catch(() => {
        if (!user) {
          showToast("Could not load media kit", "error");
          return;
        }

        const userKit = user.media_kit || {};
        setCreator({
          username: user.username,
          public_slug: user.public_slug || user.username,
          profile_image_url: user.profile_image_url,
          social_links: user.social_links || {}
        });
        setKit({
          ...emptyKit,
          ...userKit,
          enabled: user.media_kit_enabled === true || userKit.enabled === true
        });
        setPortfolio([]);
        setBrandExperience(null);
      })
      .finally(() => setLoading(false));
  }, [showToast, user]);

  const publicHandle = creator?.public_slug || creator?.username || user?.public_slug || user?.username || "";
  const publicPath = `/${publicHandle}`;
  const publicUrl = publicHandle ? `${window.location.origin}${publicPath}` : "";
  const selectedIds = new Set((kit.selected_portfolio_ids || []).map(Number));
  const selectedWork = portfolio.filter((item) => selectedIds.has(Number(item.id)));

  const update = (key, value) => setKit((prev) => ({ ...prev, [key]: value }));
  const updateNested = (key, value) => setKit((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), ...value } }));

  const save = async () => {
    try {
      setSaving(true);
      await updateMediaKit(kit);
      showToast("Media kit saved", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Could not save media kit", "error");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    showToast("Media kit link copied", "success");
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setPhotoUploading(true);
      const url = await uploadProfilePhoto(file);
      const refreshed = await refreshUser();
      setCreator((prev) => ({
        ...(prev || {}),
        ...(refreshed || {}),
        profile_image_url: refreshed?.profile_image_url || url
      }));
      showToast("Profile photo updated", "success");
    } catch (err) {
      showToast(err.message || "Could not upload profile photo", "error");
    } finally {
      setPhotoUploading(false);
      event.target.value = "";
    }
  };

  if (loading) return <div className="media-kit-page"><div className="media-kit-empty">Loading media kit...</div></div>;

  return (
    <div className="media-kit-page">
      <Helmet><title>Media Kit - Brandio</title></Helmet>

      <header className="media-kit-head">
        <div>
          <span>Media Kit</span>
          <h1>Build the public profile brands see before they decide to work with you.</h1>
        </div>
        <button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save media kit"}</button>
      </header>

      <main className="media-kit-layout">
        <div className="media-kit-stack">
          <EditorSection eyebrow="About you" title="Tell brands who you are, what you create, and where you're based.">
            <div className="mk-editor-grid">
              <Field label="Profile photo">
                <div className="mk-photo-edit">
                  <PreviewPhoto src={creator?.profile_image_url || user?.profile_image_url} name={kit.display_name || creator?.username || user?.username} />
                  <label className="mk-photo-upload">
                    {photoUploading ? "Uploading..." : "Upload photo"}
                    <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
                  </label>
                </div>
              </Field>
              <Field label="Display / creator name"><input value={kit.display_name} onChange={(e) => update("display_name", e.target.value)} /></Field>
              <Field label="Headline"><input value={kit.headline} onChange={(e) => update("headline", e.target.value)} /></Field>
              <Field label="Short bio" wide><textarea rows="4" value={kit.bio} onChange={(e) => update("bio", e.target.value)} /></Field>
              <Field label="Location"><input value={kit.location} onChange={(e) => update("location", e.target.value)} /></Field>
              <Field label="Primary niche"><input value={kit.niche} onChange={(e) => update("niche", e.target.value)} /></Field>
              <Field label="Additional categories"><input value={kit.categories} onChange={(e) => update("categories", e.target.value)} /></Field>
              <Field label="Languages"><input value={kit.languages} onChange={(e) => update("languages", e.target.value)} /></Field>
            </div>
          </EditorSection>

          <section className="media-kit-publish">
            <div>
              <span>Public link</span>
              <strong>{publicUrl || "Set your public handle in Profile to create a public link."}</strong>
            </div>
            <div>
              <label><input type="checkbox" checked={kit.enabled === true} onChange={(e) => update("enabled", e.target.checked)} /> Published</label>
              <button onClick={copyLink} disabled={!publicUrl}>Copy link</button>
              {publicUrl ? <Link to={publicPath} target="_blank">View media kit</Link> : <button disabled>View media kit</button>}
            </div>
          </section>

          <EditorSection eyebrow="Social profiles" title="Add the places brands can verify your creator presence.">
            <div className="mk-editor-grid">
              {["instagram", "youtube", "tiktok", "x", "other"].map((key) => (
                <Field label={platformLabel(key)} key={key}>
                  <input value={kit.social_profiles?.[key] || ""} onChange={(e) => updateNested("social_profiles", { [key]: e.target.value })} />
                </Field>
              ))}
            </div>
          </EditorSection>

          <AudienceEditor kit={kit} update={update} />
          <ServicesEditor kit={kit} update={update} />
          <SelectedWork portfolio={portfolio} selectedIds={selectedIds} update={update} />
          <BrandExperience data={brandExperience} kit={kit} update={update} />
          <Preferences kit={kit} update={update} />
        </div>

        <aside className="media-kit-side">
          <section>
            <h2>Public visibility</h2>
            {Object.entries({
              about: "About",
              audience: "Audience & performance",
              services: "Services",
              selected_work: "Selected work",
              brand_experience: "Brand experience",
              testimonials: "Testimonials",
              collaboration_preferences: "Collaboration preferences"
            }).map(([key, label]) => (
              <label key={key}><input type="checkbox" checked={kit.visibility?.[key] !== false} onChange={(e) => updateNested("visibility", { [key]: e.target.checked })} /> {label}</label>
            ))}
          </section>
          <section>
            <h2>Preview</h2>
            <PreviewCard kit={kit} creator={creator} selectedWork={selectedWork} brandExperience={brandExperience} />
          </section>
        </aside>
      </main>
    </div>
  );
}

function EditorSection({ eyebrow, title, children }) {
  return <section className="mk-editor-section"><span>{eyebrow}</span><h2>{title}</h2>{children}</section>;
}

function Field({ label, children, wide }) {
  return <label className={`mk-editor-field ${wide ? "wide" : ""}`}><span>{label}</span>{children}</label>;
}

function PreviewPhoto({ src, name }) {
  return <div className="mk-photo-small"><img src={src || `https://ui-avatars.com/api/?name=${name || "Creator"}`} alt="" /></div>;
}

function AudienceEditor({ kit, update }) {
  const metrics = kit.audience_metrics || [];
  const setMetrics = (next) => update("audience_metrics", next);
  return (
    <EditorSection eyebrow="Audience & performance" title="Show platform-specific numbers brands actually understand.">
      <label className="mk-editor-check"><input type="checkbox" checked={kit.audience_public !== false} onChange={(e) => update("audience_public", e.target.checked)} /> Show audience & performance publicly</label>
      <div className="mk-list-stack">
        {metrics.map((metric, index) => (
          <div className="mk-repeat-card" key={index}>
            <select value={metric.platform || "Instagram"} onChange={(e) => setMetrics(updateArray(metrics, index, { platform: e.target.value }))}>
              {["Instagram", "YouTube", "TikTok", "X"].map((p) => <option key={p}>{p}</option>)}
            </select>
            <div className="mk-editor-grid">
              <input placeholder="Followers / subscribers" value={metric.followers || metric.subscribers || ""} onChange={(e) => setMetrics(updateArray(metrics, index, metric.platform === "YouTube" ? { subscribers: e.target.value } : { followers: e.target.value }))} />
              <input placeholder="Average views" value={metric.average_views || ""} onChange={(e) => setMetrics(updateArray(metrics, index, { average_views: e.target.value }))} />
              <input placeholder="Average Reel views" value={metric.average_reel_views || ""} onChange={(e) => setMetrics(updateArray(metrics, index, { average_reel_views: e.target.value }))} />
              <input placeholder="Average Story views" value={metric.average_story_views || ""} onChange={(e) => setMetrics(updateArray(metrics, index, { average_story_views: e.target.value }))} />
              <input placeholder="Engagement rate" value={metric.engagement_rate || ""} onChange={(e) => setMetrics(updateArray(metrics, index, { engagement_rate: e.target.value }))} />
              <input placeholder="Monthly reach" value={metric.monthly_reach || ""} onChange={(e) => setMetrics(updateArray(metrics, index, { monthly_reach: e.target.value }))} />
            </div>
            <button onClick={() => setMetrics(metrics.filter((_, i) => i !== index))}>Remove platform</button>
          </div>
        ))}
      </div>
      <button className="mk-secondary" onClick={() => setMetrics([...metrics, { platform: "Instagram" }])}>Add platform metrics</button>
    </EditorSection>
  );
}

function ServicesEditor({ kit, update }) {
  const services = kit.collaboration_options || [];
  const setServices = (next) => update("collaboration_options", next);
  return (
    <EditorSection eyebrow="Collaboration options" title="Tell brands what they can hire you for.">
      <div className="mk-list-stack">
        {services.map((service, index) => (
          <div className="mk-repeat-card" key={index}>
            <div className="mk-editor-grid">
              <input placeholder="Service name" value={service.name || ""} onChange={(e) => setServices(updateArray(services, index, { name: e.target.value }))} />
              <input placeholder="Short description" value={service.description || ""} onChange={(e) => setServices(updateArray(services, index, { description: e.target.value }))} />
              <input placeholder="Starting price" value={service.starting_price || ""} onChange={(e) => setServices(updateArray(services, index, { starting_price: e.target.value }))} />
              <select value={service.currency || "₹"} onChange={(e) => setServices(updateArray(services, index, { currency: e.target.value }))}><option>₹</option><option>$</option><option>₦</option></select>
            </div>
            <label><input type="checkbox" checked={service.show_price === true} onChange={(e) => setServices(updateArray(services, index, { show_price: e.target.checked }))} /> Show price publicly</label>
            <button onClick={() => setServices(services.filter((_, i) => i !== index))}>Remove service</button>
          </div>
        ))}
      </div>
      <button className="mk-secondary" onClick={() => setServices([...services, { name: "", description: "", starting_price: "", currency: "₹", show_price: true }])}>Add service</button>
    </EditorSection>
  );
}

function SelectedWork({ portfolio, selectedIds, update }) {
  const toggle = (id) => {
    const next = new Set(selectedIds);
    next.has(Number(id)) ? next.delete(Number(id)) : next.add(Number(id));
    update("selected_portfolio_ids", Array.from(next));
  };
  return (
    <EditorSection eyebrow="Selected work" title="Choose existing portfolio work to feature on your public media kit.">
      {!portfolio.length && <div className="media-kit-empty inline">Your best work will appear here. <Link to="/portfolio">Add portfolio work</Link></div>}
      <div className="mk-work-select">
        {portfolio.map((item) => (
          <article key={item.id}>
            <img src={item.thumbnail_url || `https://ui-avatars.com/api/?name=${item.brand_name}`} alt="" />
            <div><strong>{item.campaign_title || item.brand_name}</strong><span>{item.brand_name} · {formatPlatform(item)}</span></div>
            <label><input type="checkbox" checked={selectedIds.has(Number(item.id))} onChange={() => toggle(item.id)} /> Show</label>
          </article>
        ))}
      </div>
    </EditorSection>
  );
}

function BrandExperience({ data, kit, update }) {
  return (
    <EditorSection eyebrow="Brand experience" title="Built from your existing deals. Revenue and private details are never shown.">
      <label className="mk-editor-check"><input type="checkbox" checked={kit.brand_experience_public !== false} onChange={(e) => update("brand_experience_public", e.target.checked)} /> Show brand experience publicly</label>
      {data && <div className="mk-brand-exp">
        <div><strong>{data.total_collaborations || 0}</strong><span>Collaborations</span></div>
        <div><strong>{data.unique_brands || 0}</strong><span>Unique brands</span></div>
        <div><strong>{data.repeat_brands || 0}</strong><span>Repeat brands</span></div>
        <p>Worked with {(data.brands || []).map((b) => b.brand_name).join(" · ") || "No recorded brands yet"}</p>
      </div>}
    </EditorSection>
  );
}

function Preferences({ kit, update }) {
  const prefs = kit.collaboration_preferences || { work_types: [], categories: "" };
  const selected = new Set(prefs.work_types || []);
  const toggle = (type) => {
    selected.has(type) ? selected.delete(type) : selected.add(type);
    update("collaboration_preferences", { ...prefs, work_types: Array.from(selected) });
  };
  return (
    <EditorSection eyebrow="Collaboration preferences" title="Let brands know what kinds of work you're open to.">
      <label className="mk-editor-check"><input type="checkbox" checked={kit.collaboration_preferences_public !== false} onChange={(e) => update("collaboration_preferences_public", e.target.checked)} /> Show collaboration preferences publicly</label>
      <div className="mk-chip-grid">{workTypes.map((type) => <button className={selected.has(type) ? "active" : ""} onClick={() => toggle(type)} key={type}>{type}</button>)}</div>
      <Field label="Categories / industries"><input value={prefs.categories || ""} onChange={(e) => update("collaboration_preferences", { ...prefs, categories: e.target.value })} /></Field>
    </EditorSection>
  );
}

function PreviewCard({ kit, creator, selectedWork, brandExperience }) {
  return <div className="mk-mini-preview">
    <img src={creator?.profile_image_url || `https://ui-avatars.com/api/?name=${kit.display_name || creator?.username}`} alt="" />
    <strong>{kit.display_name || creator?.username}</strong>
    <p>{kit.headline || "Creator media kit"}</p>
    <span>{selectedWork.length} selected work items</span>
    <span>{brandExperience?.total_collaborations || 0} collaborations</span>
  </div>;
}

function updateArray(items, index, patch) {
  return items.map((item, i) => i === index ? { ...item, ...patch } : item);
}

function platformLabel(key) {
  return { instagram: "Instagram", youtube: "YouTube", tiktok: "TikTok", x: "X / Twitter", other: "Other link" }[key] || key;
}
