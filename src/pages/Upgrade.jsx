import { useState, useEffect } from "react";
import { startUpgrade } from "../lib/payments";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";
import "../styles/pricing.css";
import { useNavigate } from "react-router-dom";

export default function Upgrade() {
  const { user, setUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  /* 🟡 WAIT FOR AUTH */
  if (authLoading) {
    return (
      <div className="container py-5 text-center">
        <p className="text-muted">Loading pricing…</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  /* 🔒 Redirect Pro users */
  useEffect(() => {
    if (user.plan === "pro") {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  if (user.plan === "pro") return null;

  /* ✅ SAME COUNTRY LOGIC AS Pricing.jsx */
  const countryCode = user.country_code || "IN";
  const isIndia = countryCode === "IN";

  const monthlyPrice = isIndia ? "₹99" : "$5";
  const yearlyPrice = isIndia ? "₹499" : "$49";

  const handleUpgrade = async (planType) => {
    try {
      setLoading(true);

      await startUpgrade(planType, async () => {
        await api.post("/payments/confirm", { planType });

        const res = await api.get("/profile/me");
        setUser(res.data);

        setToast({
          type: "success",
          message: "🎉 Pro activated successfully!"
        });

        navigate("/dashboard", { replace: true });
      });
    } catch {
      setToast({
        type: "error",
        message: "Payment failed or cancelled"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pricing-page">
      <header className="pricing-hero">
        <h1>
          Simple pricing for <span>creators</span>
        </h1>
        <p>Start free. Upgrade only when brand deals become real money.</p>
      </header>

      <section className="pricing-grid">
        {/* MONTHLY */}
        <div className="pricing-card">
          <h3>Creator</h3>
          <div className="price">{monthlyPrice}</div>
          <p className="price-note">per month</p>

          <ul>
            <li>✔ Unlimited brand deals</li>
            <li>✔ Payment reminders</li>
            <li>✔ Advanced deal analytics</li>
            <li>✔ Email notifications</li>
            <li>✔ Priority support</li>
          </ul>

          <button
            className="btn-primary"
            disabled={loading}
            onClick={() => handleUpgrade("monthly")}
          >
            Upgrade
          </button>
        </div>

        {/* YEARLY */}
        <div className="pricing-card highlight">
          <div className="badge">Most Popular</div>
          <h3>Pro</h3>
          <div className="price">{yearlyPrice}</div>
          <p className="price-note">per year</p>

          <ul>
            <li>✔ Unlimited brand deals</li>
            <li>✔ Payment reminders</li>
            <li>✔ Advanced deal analytics</li>
            <li>✔ Email notifications</li>
            <li>✔ Priority support</li>
          </ul>

          <button
            className="btn-primary"
            disabled={loading}
            onClick={() => handleUpgrade("yearly")}
          >
            Upgrade
          </button>
        </div>
      </section>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
