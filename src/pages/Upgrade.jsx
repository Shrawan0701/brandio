import { useState } from "react";
import { startUpgrade } from "../lib/payments";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";
import "../styles/pricing.css";
import { useNavigate } from "react-router-dom";

export default function Upgrade() {
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();


  const handleUpgrade = async (planType) => {
    try {
      setLoading(true);

      await startUpgrade(planType, async () => {
        // ✅ confirm immediately
        await api.post("/payments/confirm", { planType });

        // refresh user
        const res = await api.get("/profile/me");
        setUser(res.data);

        setToast({
  type: "success",
  message: "🎉 Pro activated successfully!"
});

navigate("/dashboard", { replace: true });

      });
    } catch (err) {
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
        {/* CREATOR */}
        <div className="pricing-card">
          <h3>Creator</h3>
          <div className="price">₹99</div>
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

        {/* PRO */}
        <div className="pricing-card highlight">
          <div className="badge">Most Popular</div>
          <h3>Pro</h3>
          <div className="price">₹499</div>
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
