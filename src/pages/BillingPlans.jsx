import { WorkspaceHeader } from "../components/WorkspaceUI";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";
import { getPaidPlans, isProActive } from "../utils/pricing";
import { startUpgrade } from "../lib/payments";
import "../styles/billing.css";

export default function BillingPlans() {
  const { user, setUser } = useAuth();
  const location = useLocation();
  const [toast, setToast] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState("");
  const status = getPlanStatus(user);
  const isPro = isProActive(user);
  const plans = getPaidPlans(user?.country_code || "IN");

  const handleUpgrade = async (planType) => {
    try {
      setLoadingPlan(planType);
      await startUpgrade(planType, setUser, user.country_code);
      setToast({ type: "success", message: "Payment successful. Your Pro access has been extended." });
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.message || err.message || "Payment cancelled or failed" });
    } finally {
      setLoadingPlan("");
    }
  };

  const showPlans = () => document.getElementById("billing-plans")?.scrollIntoView({ behavior: "smooth", block: "center" });

  useEffect(() => {
    if (!location.state?.paymentSuccess) return;
    setToast({
      type: "success",
      message: location.state.message || "Payment successful. Your PRO plan is now active."
    });
    window.history.replaceState({}, document.title);
  }, [location.state]);

  return (
    <div className="billing-page workspace-page">
      <Helmet><title>Billing & Plans - Brandio</title></Helmet>

      <WorkspaceHeader eyebrow="Account / Billing" title="Billing & plans" description="Your current plan, access, and renewal options in one place." actions={<div className={`billing-plan-chip ${isPro ? "pro" : "free"}`}><span>Current plan</span><strong>{isPro ? "PRO" : "FREE"}</strong></div>} />

      <section className="billing-overview">
        <div>
          <span className="billing-label">Plan status</span>
          <h2>{status.label}</h2>
          <p>{status.detail}</p>
        </div>
        <div className="billing-actions">
          {isPro ? (
            <>
              <button onClick={showPlans}>Choose renewal period</button>
              <Link to="/pricing">Change plan</Link>
            </>
          ) : (
            <>
              <button onClick={showPlans}>Upgrade to Pro</button>
              <Link to="/pricing">Compare plans</Link>
            </>
          )}
        </div>
      </section>

      <section className="billing-grid" id="billing-plans">
        {plans.map((plan) => (
          <article key={plan.id} className={`billing-plan-card ${plan.featured ? "featured" : ""}`}>
            <div>
              <span className="billing-label">{plan.name}</span>
              <h3>{plan.price}</h3>
              <p>{plan.cadence}</p>
            </div>
            <ul>
              <li>Unlimited brand deals</li>
              <li>Every Brandio feature included</li>
              <li>{plan.detail}</li>
            </ul>
            <button disabled={Boolean(loadingPlan)} onClick={() => handleUpgrade(plan.id)}>
              {loadingPlan === plan.id ? "Opening checkout..." : isPro ? `Extend ${plan.name.replace("Pro ", "")}` : `Choose ${plan.name.replace("Pro ", "")}`}
            </button>
          </article>
        ))}
      </section>

      <section className="billing-note">
        <h2>Subscription controls</h2>
        <p>Every account can access all features. Free access includes 1 lifetime deal; deleting it does not restore the allowance. Pro adds unlimited deals.</p>
        <p>Your plan renews when you choose. Renewals extend any remaining paid time; automatic recurring billing is off.</p>
      </section>
      <p className="billing-support">Contact <a href="mailto:support@brandio.world">support@brandio.world</a> for any help.</p>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}

function getPlanStatus(user) {
  if (!user) return { label: "Loading", detail: "Checking your account..." };
  if (user.plan !== "pro") return { label: "Free plan active", detail: "All features are available with 1 lifetime free deal. Upgrade to create more deals." };
  if (!user.plan_expiry) return { label: "PRO active", detail: "No expiry date is currently stored for this account." };
  const expiry = new Date(user.plan_expiry);
  const days = Math.ceil((expiry - new Date()) / 86400000);
  if (days <= 0) return { label: "PRO expired", detail: `Expired on ${expiry.toLocaleDateString()}.`, expired: true };
  return { label: days <= 7 ? "PRO expiring soon" : "PRO active", detail: `Valid until ${expiry.toLocaleDateString()} (${days} days left).` };
}
