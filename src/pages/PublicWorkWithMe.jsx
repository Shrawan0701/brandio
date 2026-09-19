import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { fetchCreatorWorkPage, submitInboundInquiry } from "../lib/api";

const initial = {
  campaign_type: "",
  platform: "",
  budget: "",
  deliverables: "",
  deadline: "",
  usage_requirements: "",
  brand: "",
  contact: "",
  email: "",
  website: "",
  campaign: "",
  description: ""
};

export default function PublicWorkWithMe() {
  const { username } = useParams();
  const [creator, setCreator] = useState(null);
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCreatorWorkPage(username)
      .then((data) => setCreator(data.creator))
      .catch(() => setError("This creator page is not available."))
      .finally(() => setLoading(false));
  }, [username]);

  const socialStats = useMemo(() => {
    const links = creator?.social_links || {};
    return [
      links.instagram && "Instagram",
      links.youtube && "YouTube",
      links.tiktok && "TikTok"
    ].filter(Boolean);
  }, [creator]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await submitInboundInquiry(username, form);
      setSent(true);
      setForm(initial);
    } catch (err) {
      setError(err.response?.data?.message || "Could not send request");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="wwm-page"><div className="wwm-card">Loading...</div></div>;

  return (
    <div className="wwm-page">
      <Helmet>
        <title>Work with {creator?.username || "Creator"} - Brandio</title>
      </Helmet>

      <main className="wwm-shell">
        <section className="wwm-hero">
          <div className="wwm-brand">Brandio</div>
          {creator?.profile_image_url && <img src={creator.profile_image_url} alt={creator.username} />}
          <h1>{creator?.username || "Creator Profile"}</h1>
          <p>Fashion • Beauty • Lifestyle</p>
          <div className="wwm-socials">
            {(socialStats.length ? socialStats : ["Instagram", "YouTube"]).map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </section>

        <section className="wwm-card">
          <h2>Work with me</h2>
          <p className="wwm-muted">Tell me about your campaign and I will review the fit.</p>

          {sent ? (
            <div className="wwm-success">
              <h3>Request sent</h3>
              <p>Your collaboration inquiry has been shared with the creator.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="wwm-form">
              {error && <div className="wwm-error">{error}</div>}

              <select value={form.campaign_type} onChange={(e) => update("campaign_type", e.target.value)}>
                <option value="">Campaign type</option>
                <option>Sponsored post</option>
                <option>UGC</option>
                <option>Affiliate</option>
                <option>Event</option>
                <option>Product launch</option>
              </select>
              <input placeholder="Platform" value={form.platform} onChange={(e) => update("platform", e.target.value)} />
              <input placeholder="Budget range" value={form.budget} onChange={(e) => update("budget", e.target.value)} />
              <textarea placeholder="Deliverables" value={form.deliverables} onChange={(e) => update("deliverables", e.target.value)} />
              <label>
                Campaign deadline
                <input type="date" value={form.deadline} onChange={(e) => update("deadline", e.target.value)} />
              </label>
              <textarea placeholder="Usage requirements" value={form.usage_requirements} onChange={(e) => update("usage_requirements", e.target.value)} />
              <input required placeholder="Brand/company name" value={form.brand} onChange={(e) => update("brand", e.target.value)} />
              <input required placeholder="Contact person" value={form.contact} onChange={(e) => update("contact", e.target.value)} />
              <input required type="email" placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} />
              <input placeholder="Website" value={form.website} onChange={(e) => update("website", e.target.value)} />
              <input placeholder="Campaign name" value={form.campaign} onChange={(e) => update("campaign", e.target.value)} />
              <textarea placeholder="Campaign description" value={form.description} onChange={(e) => update("description", e.target.value)} />
              <button disabled={saving}>{saving ? "Sending..." : "Send collaboration request"}</button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
