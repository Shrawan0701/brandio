import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

import api, {
  updateProfile,
  updatePublicSlug,
  uploadProfilePhoto,
  updateSocialLinks,
  updateMediaKit,
  fetchDeals
} from "../lib/api";

import Toast from "../components/Toast";

export default function Profile() {
  const { user, setUser, loading, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  /* ---------- STATE ---------- */
  const [username, setUsername] = useState(user?.username || "");
  const [publicSlug, setPublicSlug] = useState(user?.public_slug || "");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [toast, setToast] = useState(null);

  /* ---------- DEAL STATS ---------- */
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    completed: 0
  });

  /* ---------- SOCIAL LINKS ---------- */
  const [socials, setSocials] = useState({
    instagram: "",
    x: "",
    youtube: "",
    reddit: ""
  });

  const [mediaKit, setMediaKit] = useState({
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
    metrics: [{ label: "", value: "" }],
    services: [{ name: "", description: "" }],
    rates: [{ name: "", price: "" }],
    public_brands: [{ name: "" }]
  });

  /* ---------- INIT DATA ---------- */
  useEffect(() => {
    if (!user) return;
    setUsername(user.username || "");
    setPublicSlug(user.public_slug || user.username || "");

    if (user?.social_links) {
      setSocials({
        instagram: user.social_links.instagram || "",
        x: user.social_links.x || "",
        youtube: user.social_links.youtube || "",
        reddit: user.social_links.reddit || ""
      });
    }

    if (user?.media_kit) {
      const kit = user.media_kit;
      setMediaKit((prev) => ({
        ...prev,
        ...kit,
        enabled: user.media_kit_enabled === true || kit.enabled === true,
        metrics: kit.metrics?.length ? kit.metrics : prev.metrics,
        services: kit.services?.length ? kit.services : prev.services,
        rates: kit.rates?.length ? kit.rates : prev.rates,
        public_brands: kit.public_brands?.length ? kit.public_brands : prev.public_brands
      }));
    }

    fetchDeals().then((data) => {
      const deals = data.deals || [];
      setStats({
        total: deals.length,
        active: deals.filter(d => d.status === "active").length,
        pending: deals.filter(d => d.status === "pending").length,
        completed: deals.filter(d => d.status === "completed").length
      });
    });
  }, [user]);

  /* ---------- HELPERS ---------- */
  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  /* ---------- PLAN STATUS (PRO ONLY) ---------- */
  const getPlanStatus = () => {
    if (!user) return null;
    if (user.plan !== "pro" || !user.plan_expiry) return null;

    const expiry = new Date(user.plan_expiry);
    const now = new Date();

    const diffInDays = Math.ceil(
      (expiry - now) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays <= 0) return { status: "expired" };
    if (diffInDays <= 7) return { status: "expiring", daysLeft: diffInDays };

    return { status: "active" };
  };

  const planStatus = getPlanStatus();

  /* ---------- BLOCK UNTIL AUTH READY ---------- */
  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-dark" />
      </div>
    );
  }

  if (!user) return null;

  /* ---------- LOGOUT ---------- */
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  /* ---------- SAVE PROFILE ---------- */
  const handleSaveProfile = async () => {
    try {
      const updated = await updateProfile(username);
      setUser({ ...user, ...updated });
      showToast("Profile updated successfully");
    } catch {
      showToast("Failed to update profile", "error");
    }
  };

  const handleSavePublicSlug = async () => {
    try {
      const updated = await updatePublicSlug(publicSlug);
      setUser({ ...user, ...updated });
      setPublicSlug(updated.public_slug || publicSlug);
      showToast("Public handle updated");
    } catch (err) {
      showToast(err.response?.data?.message || "Public handle is not available", "error");
    }
  };

  /* ---------- PHOTO UPLOAD ---------- */
  const handlePhotoChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    setPhotoUploading(true);

    await uploadProfilePhoto(file);

    // 🔥 THIS IS THE MISSING PIECE
    await refreshUser();

    showToast("Profile photo updated");
  } catch (err) {
    showToast("Photo upload failed", "error");
  } finally {
    setPhotoUploading(false);
  }
};


  /* ---------- SAVE SOCIAL LINKS ---------- */
  const handleSaveSocials = async () => {
    try {
      await updateSocialLinks(socials);
      await refreshUser();
      showToast("Social links updated");
    } catch {
      showToast("Failed to update social links", "error");
    }
  };

  const updateKit = (key, value) =>
    setMediaKit((prev) => ({ ...prev, [key]: value }));

  const updateKitList = (key, index, field, value) =>
    setMediaKit((prev) => ({
      ...prev,
      [key]: prev[key].map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));

  const addKitListItem = (key, shape) =>
    setMediaKit((prev) => ({ ...prev, [key]: [...prev[key], shape] }));

  const handleSaveMediaKit = async () => {
    try {
      const updated = await updateMediaKit(mediaKit);
      setUser({ ...user, ...updated });
      showToast("Media kit updated");
    } catch {
      showToast("Failed to update media kit", "error");
    }
  };

  const displayName = mediaKit.display_name || user.username;
  const canonicalHandle = user.public_slug || publicSlug || user.username;
  const publicUrl = `/${canonicalHandle}`;
  const workWithMeUrl = `${publicUrl}/work-with-me`;

  return (
    <div className="profile-page">

      {/* ================= PROFILE HEADER ================= */}
      <section className="profile-hero">
        <div className="profile-identity">
          <img
            src={
              user.profile_image_url ||
              `https://ui-avatars.com/api/?name=${user.username}`
            }
            className="profile-avatar"
            alt="profile"
          />

          <div>
            <span className="profile-kicker">Professional creator identity</span>
            <h1>{displayName}</h1>
            <p>{mediaKit.headline || "Build a public business profile, media kit, and collaboration hub for your brand work."}</p>
            <div className="profile-meta">
              <span className={`plan-badge ${user.plan}`}>{user.plan.toUpperCase()}</span>
              <span>{mediaKit.location || "Location not set"}</span>
              <span>{mediaKit.enabled ? "Media kit public" : "Media kit private"}</span>
            </div>
          </div>
        </div>
        <div className="profile-actions">
          <label className="profile-upload">
            {photoUploading ? "Uploading..." : "Change photo"}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => {
                handlePhotoChange(e);
                e.target.value = null;
              }}
            />
          </label>
          <button onClick={() => navigate(publicUrl)}>View media kit</button>
        </div>
      </section>

      {user.plan === "pro" && user.plan_expiry && (
        <div className={`profile-plan-card ${planStatus?.status}`}>
          <div className="plan-active">
            <div>
              <h6>Subscription</h6>
              {planStatus?.status === "active" && (
                <p>Valid till <b>{new Date(user.plan_expiry).toLocaleDateString()}</b></p>
              )}
              {planStatus?.status === "expiring" && (
                <p>Expires in <b>{planStatus.daysLeft} days</b>. Renew to avoid interruption.</p>
              )}
              {planStatus?.status === "expired" && (
                <p>Your subscription has expired. Please upgrade again.</p>
              )}
            </div>
            {planStatus?.status !== "active" && (
              <button onClick={() => navigate("/pricing")}>
                {planStatus.status === "expired" ? "Upgrade again" : "Renew Pro"}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="profile-stat-strip">
        <StatCard label="Total deals" value={stats.total} variant="total" />
        <StatCard label="Active" value={stats.active} variant="active" />
        <StatCard label="Pending" value={stats.pending} variant="pending" />
        <StatCard label="Completed" value={stats.completed} variant="completed" />
      </div>

      <div className="profile-layout">
        <main className="profile-stack">
          <section className="profile-panel">
            <SectionHead title="Profile" eyebrow="Basic information" />
            <div className="profile-form-grid">
              <Field label="Username">
                <input
                  className="form-control"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </Field>
              <Field label="Public handle">
                <input
                  className="form-control"
                  value={publicSlug}
                  onChange={(e) => setPublicSlug(e.target.value)}
                />
              </Field>
              <Field label="Email">
                <input className="form-control" disabled value={user.email} />
              </Field>
              <Field label="Display name">
                <input className="form-control" value={mediaKit.display_name} onChange={(e) => updateKit("display_name", e.target.value)} />
              </Field>
              <Field label="Headline">
                <input className="form-control" value={mediaKit.headline} onChange={(e) => updateKit("headline", e.target.value)} />
              </Field>
              <Field label="Bio" wide>
                <textarea className="form-control" rows="4" value={mediaKit.bio} onChange={(e) => updateKit("bio", e.target.value)} />
              </Field>
              <Field label="Niche">
                <input className="form-control" value={mediaKit.niche} onChange={(e) => updateKit("niche", e.target.value)} />
              </Field>
              <Field label="Location">
                <input className="form-control" value={mediaKit.location} onChange={(e) => updateKit("location", e.target.value)} />
              </Field>
              <Field label="Languages">
                <input className="form-control" value={mediaKit.languages} onChange={(e) => updateKit("languages", e.target.value)} />
              </Field>
              <Field label="Categories">
                <input className="form-control" value={mediaKit.categories} onChange={(e) => updateKit("categories", e.target.value)} />
              </Field>
            </div>
            <div className="profile-panel-actions">
              <button onClick={handleSaveProfile}>Save profile</button>
              <button onClick={handleSavePublicSlug}>Save public handle</button>
              <button onClick={handleSaveMediaKit}>Save identity details</button>
            </div>
          </section>

          <section className="profile-panel">
            <SectionHead title="Social links" eyebrow="Creator presence" />
            <div className="profile-form-grid">
              {[
                ["instagram", "Instagram", "https://instagram.com/username"],
                ["x", "X / Twitter", "https://x.com/username"],
                ["youtube", "YouTube", "https://youtube.com/@channel"],
                ["reddit", "Reddit", "https://reddit.com/u/username"]
              ].map(([key, label, placeholder]) => (
                <Field label={label} key={key}>
                  <input
                    className="form-control"
                    placeholder={placeholder}
                    value={socials[key]}
                    onChange={(e) => setSocials({ ...socials, [key]: e.target.value })}
                  />
                </Field>
              ))}
            </div>
            <div className="profile-panel-actions">
              <button onClick={handleSaveSocials}>Save social links</button>
            </div>
          </section>

          <section className="profile-panel">
            <SectionHead title="Business" eyebrow="Services, rates and proof" />
            <KitList
              title="Public metrics"
              items={mediaKit.metrics}
              fields={[["label", "Metric label"], ["value", "Metric value"]]}
              onChange={(index, field, value) => updateKitList("metrics", index, field, value)}
              onAdd={() => addKitListItem("metrics", { label: "", value: "" })}
            />
            <KitList
              title="Services"
              items={mediaKit.services}
              fields={[["name", "Service"], ["description", "Description"]]}
              onChange={(index, field, value) => updateKitList("services", index, field, value)}
              onAdd={() => addKitListItem("services", { name: "", description: "" })}
            />
            <label className="profile-toggle">
              <input
                type="checkbox"
                checked={mediaKit.show_rates}
                onChange={(e) => updateKit("show_rates", e.target.checked)}
              />
              <span>Show starting rates publicly</span>
            </label>
            <KitList
              title="Starting rates"
              items={mediaKit.rates}
              fields={[["name", "Offer"], ["price", "Starting from"]]}
              onChange={(index, field, value) => updateKitList("rates", index, field, value)}
              onAdd={() => addKitListItem("rates", { name: "", price: "" })}
            />
            <KitList
              title="Featured brands"
              items={mediaKit.public_brands}
              fields={[["name", "Brand name"]]}
              onChange={(index, field, value) => updateKitList("public_brands", index, field, value)}
              onAdd={() => addKitListItem("public_brands", { name: "" })}
            />
            <div className="profile-panel-actions">
              <button onClick={handleSaveMediaKit}>Save business profile</button>
            </div>
          </section>
        </main>

        <aside className="profile-sidebar">
          <section className="profile-preview">
            <div className="profile-preview-top">
              <span>{mediaKit.enabled ? "Public" : "Private"}</span>
              <label className="profile-switch">
                <input
                  type="checkbox"
                  checked={mediaKit.enabled}
                  onChange={(e) => updateKit("enabled", e.target.checked)}
                />
                <i />
              </label>
            </div>
            <img
              src={user.profile_image_url || `https://ui-avatars.com/api/?name=${user.username}`}
              alt=""
            />
            <h2>{displayName}</h2>
            <p>{mediaKit.bio || "Your public media kit preview will update as you add your creator story, proof and offers."}</p>
            <div className="profile-preview-tags">
              {(mediaKit.niche || "Creator business").split(",").slice(0, 3).map((tag) => (
                <span key={tag}>{tag.trim()}</span>
              ))}
            </div>
            <button onClick={() => navigate(publicUrl)}>Open public preview</button>
          </section>

          <section className="profile-panel compact">
            <SectionHead title="Media kit" eyebrow="Publishing" />
            <p className="profile-muted">Public URL</p>
            <strong className="profile-url">brandio.world{publicUrl}</strong>
            <p className="profile-muted">Work With Me URL</p>
            <strong className="profile-url">brandio.world{workWithMeUrl}</strong>
            <label className="profile-toggle">
              <input
                type="checkbox"
                checked={mediaKit.show_cta}
                onChange={(e) => updateKit("show_cta", e.target.checked)}
              />
              <span>Show Work With Me CTA</span>
            </label>
            <button className="profile-save-wide" onClick={handleSaveMediaKit}>Save media kit</button>
          </section>

          <section className="profile-panel compact">
            <SectionHead title="Account" eyebrow="Security" />
            <p className="profile-muted">Current plan</p>
            <strong>{user.plan.toUpperCase()}</strong>
            {user.plan_expiry && <p className="profile-muted mt-2">Valid until {new Date(user.plan_expiry).toLocaleDateString()}</p>}
            <button className="profile-save-wide" onClick={() => navigate("/billing")}>Billing & Plans</button>
            <button className="profile-logout" onClick={handleLogout}>Logout</button>
          </section>
        </aside>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

function SectionHead({ title, eyebrow }) {
  return (
    <div className="profile-section-head">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
    </div>
  );
}

function Field({ label, children, wide }) {
  return (
    <label className={`profile-field ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function KitList({ title, items, fields, onChange, onAdd }) {
  return (
    <div className="mt-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="fw-semibold mb-0">{title}</h6>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onAdd}>
          Add
        </button>
      </div>
      {items.map((item, index) => (
        <div className="d-flex gap-2 mb-2" key={`${title}-${index}`}>
          {fields.map(([field, placeholder]) => (
            <input
              key={field}
              className="form-control"
              placeholder={placeholder}
              value={item[field] || ""}
              onChange={(e) => onChange(index, field, e.target.value)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ================= STAT CARD ================= */
function StatCard({ label, value, variant }) {
  return (
    <div className={`stat-card ${variant}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
