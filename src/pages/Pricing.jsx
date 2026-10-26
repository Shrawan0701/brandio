import { WorkspaceHeader } from "../components/WorkspaceUI";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../context/AuthContext";
import { startUpgrade } from "../lib/payments";
import Toast from "../components/Toast";
import MarketingFooter from "../components/MarketingFooter";
import { getPaidPlans, isProActive, PRO_FEATURES } from "../utils/pricing";
import "../styles/pricing.css";

export default function Pricing() {
  const { user, setUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState("");

  const countryCode = user?.country_code || "IN";
  const isPro = isProActive(user);
  const plans = getPaidPlans(countryCode);

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
      }, user.country_code);
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || err.message || "Payment cancelled or failed"
      });
    } finally {
      setLoadingPlan("");
    }
  };

  if (authLoading) {
    return (
      <div className={`pricing-page ${user ? "workspace-page" : ""}`}>
        <div className="pricing-loading">Loading pricing...</div>
      </div>
    );
  }

  return (
    <div className={`pricing-page ${user ? "workspace-page" : ""}`}>
      <Helmet><title>Pricing - Brandio</title></Helmet>

      {user ? <WorkspaceHeader eyebrow="Account / Pricing" title="Find your plan" description="Every plan includes all features and unlimited deals. Choose how long you need." /> : (<header className="pricing-hero">
        <span>Plans</span>
        <h1>One workspace. Three ways to go Pro.</h1>
        <p>Every plan includes all features and unlimited deals. Choose your billing period.</p>
      </header>)}

      <section className="pricing-grid">
        {plans.map((plan) => (
          <article className={`pricing-card ${plan.featured ? "featured" : ""}`} key={plan.id}>
            <div className="pricing-plan-labels">{plan.badge && <span className="pricing-badge">{plan.badge}</span>}</div>
            <div className="pricing-card-head">
              <h2>{plan.name}</h2>
              <p>{plan.description}</p>
            </div>
            <div className="pricing-price">
              <strong>{plan.price}</strong>
              <span>{plan.cadence}</span>
              <small>{plan.detail}</small>
            </div>
            <ul>
              {PRO_FEATURES.map((feature) => <li key={feature}>{feature}</li>)}
            </ul>
            <button disabled={Boolean(loadingPlan)} onClick={() => handleUpgrade(plan.id)}>
              {loadingPlan === plan.id ? "Opening checkout..." : !user ? "Create account" : isPro ? `Extend ${plan.name.replace("Pro ", "")}` : `Choose ${plan.name.replace("Pro ", "")}`}
            </button>
          </article>
        ))}
      </section>

      <div className="pricing-footer">
        <p>Start with 1 lifetime free deal and access every feature. Upgrade when you need more deals. Deleting a deal does not reset the free allowance.</p>
        {!user && <p><Link to="/register">Try your first deal free</Link></p>}
        <p>Secure Razorpay payments. Renew manually; no automatic recurring billing.</p>
        <p>Contact <a href="mailto:support@brandio.world">support@brandio.world</a> for any help.</p>
      </div>

      {!user && <MarketingFooter />}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
