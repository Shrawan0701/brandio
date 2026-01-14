import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

import api, {
  updateProfile,
  uploadProfilePhoto,
  updateSocialLinks,
  fetchDeals
} from "../lib/api";

import Toast from "../components/Toast";

export default function Profile() {
  const { user, setUser, loading, refreshUser } = useAuth();
  const navigate = useNavigate();

  /* ---------- BLOCK UNTIL AUTH READY ---------- */
  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-dark" />
      </div>
    );
  }

  if (!user) return null;

  /* ---------- STATE ---------- */
  const [username, setUsername] = useState(user.username);
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

  /* ---------- INIT DATA ---------- */
  useEffect(() => {
    if (user?.social_links) {
      setSocials({
        instagram: user.social_links.instagram || "",
        x: user.social_links.x || "",
        youtube: user.social_links.youtube || "",
        reddit: user.social_links.reddit || ""
      });
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

  /* ---------- LOGOUT ---------- */
  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
      navigate("/login");
    }
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

  return (
    <div className="container py-5" style={{ maxWidth: 600 }}>

      {/* ================= PROFILE HEADER ================= */}
      <div className="profile-header mb-4">
        <div className="profile-header-left">
          <img
            src={
              user.profile_image_url ||
              `https://ui-avatars.com/api/?name=${user.username}`
            }
            className="profile-avatar"
            alt="profile"
          />

          <div>
            <h3 className="mb-1">{user.username}</h3>
            <span className={`plan-badge ${user.plan}`}>
              {user.plan.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* ================= CHANGE PHOTO ================= */}
      <div className="mb-4">
        <label className="btn btn-outline-dark w-100">
          {photoUploading ? "Uploading..." : "Change Photo"}
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
      </div>

      {/* ================= PRO SUBSCRIPTION STATUS ================= */}
      {user.plan === "pro" && user.plan_expiry && (
        <div className={`profile-plan-card mt-4 ${planStatus?.status}`}>
          <div className="plan-active">
            <div>
              <h6 className="mb-1 fw-bold">Subscription</h6>

              {planStatus?.status === "active" && (
                <p className="text-muted mb-0">
                  Valid till{" "}
                  <b>{new Date(user.plan_expiry).toLocaleDateString()}</b>
                </p>
              )}

              {planStatus?.status === "expiring" && (
                <p className="text-warning mb-0">
                   Expires in <b>{planStatus.daysLeft} days</b>. Renew to avoid interruption.
                </p>
              )}

              {planStatus?.status === "expired" && (
                <p className="text-danger mb-0">
                   Your subscription has expired. Please upgrade again.
                </p>
              )}
            </div>

            
          </div>

          {planStatus?.status !== "active" && (
            <button
              className="btn btn-dark w-100 mt-3"
              onClick={() => navigate("/upgrade")}
            >
              {planStatus.status === "expired" ? "Upgrade Again" : "Renew Pro"}
            </button>
          )}
        </div>
      )}

      {/* ================= DEAL STATS ================= */}
      <div className="deal-stats-grid mb-5">
        <StatCard label="Total Deals" value={stats.total} variant="total" />
        <StatCard label="Active" value={stats.active} variant="active" />
        <StatCard label="Pending" value={stats.pending} variant="pending" />
        <StatCard label="Completed" value={stats.completed} variant="completed" />
      </div>

      {/* ================= PROFILE FORM ================= */}
      <div className="card p-4 mb-4">
        <input
          className="form-control mb-3"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input className="form-control mb-3" disabled value={user.email} />

        <input
          className="form-control mb-4"
          disabled
          value={user.plan.toUpperCase()}
        />

        <button
          className="btn btn-outline-dark w-100"
          onClick={handleSaveProfile}
        >
          Save Changes
        </button>
      </div>

      {/* ================= SOCIAL LINKS ================= */}
      <div className="card p-4">
        <h5 className="fw-semibold mb-3">Social Accounts</h5>

        {[
          ["instagram", "Instagram", "https://instagram.com/username"],
          ["x", "X (Twitter)", "https://x.com/username"],
          ["youtube", "YouTube", "https://youtube.com/@channel"],
          ["reddit", "Reddit", "https://reddit.com/u/username"]
        ].map(([key, label, placeholder]) => (
          <div className="mb-3" key={key}>
            <label className="form-label">{label}</label>
            <input
              className="form-control"
              placeholder={placeholder}
              value={socials[key]}
              onChange={(e) =>
                setSocials({ ...socials, [key]: e.target.value })
              }
            />
          </div>
        ))}

        <button
          className="btn btn-outline-dark w-100"
          onClick={handleSaveSocials}
        >
          Save Social Links
        </button>

        <hr className="my-4" />

        <button className="btn btn-dark w-100" onClick={handleLogout}>
          Logout
        </button>
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

/* ================= STAT CARD ================= */
function StatCard({ label, value, variant }) {
  return (
    <div className={`stat-card ${variant}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
