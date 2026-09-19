import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../context/AuthContext";
import { startUpgrade } from "../lib/payments";
import Toast from "../components/Toast";
import { COUNTRIES } from "../utils/countries";
import "../styles/pricing.css";

const PRO_FEATURES = [
  "Unlimited brand deals",
  "Payment reminders",
  "Advanced deal analytics",
  "Email notifications",
  "Priority support"
];

export default function Pricing() {
  const { user, setUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState("");

  const countryCode = user?.country_code || "IN";
  const isIndia = countryCode === "IN";
  const countryName = COUNTRIES.find((c) => c.code === countryCode)?.name || "your country";
  const isPro = user?.plan === "pro";

  const plans = useMemo(() => ([
    {
      id: "free",
      name: "Free",
      price: isIndia ? "Rs 0" : "$0",
      cadence: "forever",
      description: "For setting up your creator business workspace.",
      features: ["Core dashboard", "3 lifetime free deals", "Public creator profile"],
      current: !isPro
    },
    {
      id: "monthly",
      name: "Pro Monthly",
      price: isIndia ? "Rs 99" : "$5",
      cadence: "per month",
      description: "Flexible access to Brandio Pro for active brand work.",
      features: PRO_FEATURES
    },
    {
      id: "yearly",
      name: "Pro Yearly",
      price: isIndia ? "Rs 499" : "$49",
      cadence: "per year",
      description: "Best value for creators managing deals throughout the year.",
      features: PRO_FEATURES,
      current: isPro,
      featured: true
    }
  ]), [isIndia, isPro]);

  const handleUpgrade = async (planType) => {
    if (!user) {
      navigate("/register");
      return;
    }
    try {
      setLoadingPlan(planType);
      await startUpgrade(planType, (updatedUser) => {
        setUser(updatedUser);
        navigate("/billing", {
          replace: true,
          state: {
            paymentSuccess: true,
            message: "Payment successful. Your PRO plan is now active. Welcome to Brandio!"
          }
        });
      });
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Payment cancelled or failed"
      });
    } finally {
      setLoadingPlan("");
    }
  };

  if (authLoading) {
    return (
      <div className="pricing-page">
        <div className="pricing-loading">Loading pricing...</div>
      </div>
    );
  }

  return (
    <div className="pricing-page">
      <Helmet><title>Pricing - Brandio</title></Helmet>

      <header className="pricing-hero">
        <span>Plans</span>
        <h1>Choose the Brandio plan that fits your creator business.</h1>
        <p>Pricing for <strong>{countryName}</strong>. Upgrade or renew through secure Razorpay checkout.</p>
      </header>

      <section className="pricing-grid">
        {plans.map((plan) => (
          <article className={`pricing-card ${plan.featured ? "featured" : ""}`} key={plan.id}>
            {plan.featured && <span className="pricing-badge">Best value</span>}
            {plan.current && <span className="pricing-current">Current plan</span>}
            <div className="pricing-card-head">
              <h2>{plan.name}</h2>
              <p>{plan.description}</p>
            </div>
            <div className="pricing-price">
              <strong>{plan.price}</strong>
              <span>{plan.cadence}</span>
            </div>
            <ul>
              {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
            </ul>
            {plan.id === "free" ? (
              <button className="pricing-secondary" disabled>{plan.current ? "Current plan" : "Included"}</button>
            ) : (
              <button disabled={Boolean(loadingPlan)} onClick={() => handleUpgrade(plan.id)}>
                {loadingPlan === plan.id ? "Opening checkout..." : !user ? "Start free to upgrade" : isPro ? `Renew ${plan.name.replace("Pro ", "")}` : `Upgrade ${plan.name.replace("Pro ", "")}`}
              </button>
            )}
          </article>
        ))}
      </section>

      <p className="pricing-footer">Secure Razorpay payments. No automatic recurring billing is created by Brandio.</p>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
