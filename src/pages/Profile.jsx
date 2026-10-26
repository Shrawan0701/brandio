import { WorkspaceHeader } from "../components/WorkspaceUI";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

import {
  updateProfile,
  updatePublicSlug,
  uploadProfilePhoto,
  updateSocialLinks,
  updateMediaKit
} from "../lib/api";

import Toast from "../components/Toast";

export default function Profile() {
  const { user, setUser, loading, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  /* ---------- STATE ---------- */
  const [username, setUsername] = useState(user?.username || "");
  const [publicSlug, setPublicSlug] = useState(user?.public_slug || "");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(false);
  const [toast, setToast] = useState(null);
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [savingSocials, setSavingSocials] = useState(false);

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

  }, [user]);

  /* ---------- HELPERS ---------- */
  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

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

  const handleSaveIdentity = async () => {
    try {
      setSavingIdentity(true);
      const [profileUpdate, slugUpdate, kitUpdate] = await Promise.all([
        updateProfile(username),
        updatePublicSlug(publicSlug),
        updateMediaKit(mediaKit)
      ]);
      setUser({ ...user, ...profileUpdate, ...slugUpdate, ...kitUpdate });
      setPublicSlug(slugUpdate.public_slug || publicSlug);
      showToast("Profile saved");
    } catch (err) {
      showToast(err.response?.data?.message || "Could not save profile", "error");
    } finally {
      setSavingIdentity(false);
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
      setSavingSocials(true);
      await updateSocialLinks(socials);
      await refreshUser();
      showToast("Social links updated");
    } catch {
      showToast("Failed to update social links", "error");
    } finally {
      setSavingSocials(false);
    }
  };

  const updateKit = (key, value) =>
    setMediaKit((prev) => ({ ...prev, [key]: value }));

  const displayName = mediaKit.display_name || user.username;
  const canonicalHandle = user.public_slug || publicSlug || user.username;
  const publicUrl = `/${canonicalHandle}`;

  return (
    <div className="profile-page workspace-page">
      <Helmet><title>Profile - Brandio</title></Helmet>

      {/* ================= PROFILE HEADER ================= */}
      <WorkspaceHeader eyebrow="Account / Profile" title="Your profile" description="Manage your creator identity, public handle, and social presence." />
      <section className="profile-hero">
        <div className="profile-identity">
          <button className="profile-avatar-btn" onClick={() => setPhotoPreview(true)} aria-label="View profile photo">
            <img
              src={
                user.profile_image_url ||
                `https://ui-avatars.com/api/?name=${user.username}`
              }
              className="profile-avatar"
              alt="profile"
            />
          </button>

          <div>
            <span className="profile-kicker">Professional creator identity</span>
            <h2>{displayName}</h2>
            <p>{mediaKit.headline || "Your public creator identity and collaboration profile."}</p>
            <div className="profile-meta">
              <span className={`plan-badge ${user.plan}`}>{user.plan.toUpperCase()}</span>
              {mediaKit.location && <span>{mediaKit.location}</span>}
              <span>{mediaKit.enabled ? "Media kit public" : "Media kit private"}</span>
            </div>
          </div>
        </div>
        <div className="profile-actions">
          <label className="profile-upload">
            {photoUploading ? "Uploading..." : "Change photo"}
            <input
              type="file"
              aria-label="Change profile photo"
              disabled={photoUploading}
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
              <button disabled={savingIdentity || photoUploading} onClick={handleSaveIdentity}>{savingIdentity ? "Saving…" : "Save profile"}</button>
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
              <button disabled={savingSocials} onClick={handleSaveSocials}>{savingSocials ? "Saving…" : "Save social links"}</button>
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
                  aria-label="Publish media kit"
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
            <SectionHead title="Account" eyebrow="Security" />
            <p className="profile-muted">Current plan</p>
            <strong>{user.plan.toUpperCase()}</strong>
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

      {photoPreview && (
        <div className="profile-photo-modal" onClick={() => setPhotoPreview(false)}>
          <button aria-label="Close photo preview" onClick={() => setPhotoPreview(false)}>Close</button>
          <img
            src={user.profile_image_url || `https://ui-avatars.com/api/?name=${user.username}`}
            alt="Profile preview"
          />
        </div>
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
