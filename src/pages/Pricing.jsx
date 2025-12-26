import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { startUpgrade } from "../lib/payments";
import api from "../lib/api";
import { useEffect, useState } from "react";
import Toast from "../components/Toast";
import { COUNTRIES } from "../utils/countries";

export default function Pricing() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  /* 🔒 Redirect Pro users safely */
  useEffect(() => {
    if (user?.plan === "pro") {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  if (!user || user.plan === "pro") return null;

  /* ✅ IMPORTANT: use country_code */
  const isIndia = user.country_code === "IN";

  const countryName =
    COUNTRIES.find(c => c.code === user.country_code)?.name ||
    "Your country";

  const monthlyPrice = isIndia ? "₹199" : "$5";
  const yearlyPrice = isIndia ? "₹1499" : "$49";

 const handleUpgrade = async (plan) => {
  try {
    setLoading(true);

    await startUpgrade(plan, (updatedUser) => {
      setUser(updatedUser);

      setToast({
        type: "success",
        message: "🎉 Pro activated successfully!"
      });

      navigate("/dashboard", { replace: true });
    });

  } catch {
    setToast({
      type: "error",
      message: "Payment cancelled or failed"
    });
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="container py-5" style={{ maxWidth: 900 }}>
      <h1 className="fw-bold text-center mb-2">Upgrade to Pro</h1>

      <p className="text-center text-muted mb-5">
        Pricing for <b>{countryName}</b>
      </p>

      <div className="row g-4 justify-content-center">

        {/* MONTHLY */}
        <div className="col-md-4">
          <div className="card pricing-card p-4 text-center">
            <h5 className="fw-bold mb-3">Monthly</h5>

            <div className="price mb-3">
              {monthlyPrice}
              <span className="text-muted fs-6"> / month</span>
            </div>

            <ul className="pricing-features mb-4">
              <li>Unlimited deals</li>
              <li>Email reminders</li>
              <li>Priority support</li>
              <li>Advanced analytics</li>
            </ul>

            <button
              className="btn btn-dark w-100"
              disabled={loading}
              onClick={() => handleUpgrade("monthly")}
            >
              Upgrade Monthly
            </button>
          </div>
        </div>

        {/* YEARLY */}
        <div className="col-md-4">
          <div className="card pricing-card featured p-4 text-center">
            

            <h5 className="fw-bold mb-3">Yearly</h5>

            <div className="price mb-3">
              {yearlyPrice}
              <span className="text-muted fs-6"> / year</span>
            </div>

            <ul className="pricing-features mb-4">
              <li>Unlimited deals</li>
              <li>Email reminders</li>
              <li>Priority support</li>
              <li>Advanced analytics</li>
            </ul>

            <button
              className="btn btn-primary w-100"
              disabled={loading}
              onClick={() => handleUpgrade("yearly")}
            >
              Upgrade Yearly
            </button>
          </div>
        </div>
      </div>

      <p className="text-center text-muted mt-5">
        Secure Razorpay payments · No hidden charges
      </p>

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
