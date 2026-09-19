import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";
import "../styles/billing.css";

export default function BillingPlans() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [toast, setToast] = useState(null);
  const status = getPlanStatus(user);
  const isPro = user?.plan === "pro";

  useEffect(() => {
    if (!location.state?.paymentSuccess) return;
    setToast({
      type: "success",
      message: location.state.message || "Payment successful. Your PRO plan is now active."
    });
    window.history.replaceState({}, document.title);
  }, [location.state]);

  return (
    <div className="billing-page">
      <Helmet><title>Billing & Plans - Brandio</title></Helmet>

      <header className="billing-header">
        <div>
          <span>Account</span>
          <h1>Billing & Plans</h1>
          <p>Manage your Brandio plan, renewal status and upgrade path. Renewals stay explicit and under your control.</p>
        </div>
        <div className={`billing-plan-chip ${isPro ? "pro" : "free"}`}>
          <span>Current plan</span>
          <strong>{(user?.plan || "free").toUpperCase()}</strong>
        </div>
      </header>

      <section className="billing-overview">
        <div>
          <span className="billing-label">Plan status</span>
          <h2>{status.label}</h2>
          <p>{status.detail}</p>
        </div>
        <div className="billing-actions">
          {isPro ? (
            <>
              <button onClick={() => navigate("/pricing")}>{status.expired ? "Renew Pro" : "Renew plan"}</button>
              <Link to="/pricing">Change plan</Link>
            </>
          ) : (
            <>
              <button onClick={() => navigate("/pricing")}>Upgrade to Pro</button>
              <Link to="/pricing">Compare plans</Link>
            </>
          )}
        </div>
      </section>

      <section className="billing-grid">
        <article className="billing-plan-card">
          <div>
            <span className="billing-label">Free</span>
            <h3>Creator basics</h3>
            <p>Start tracking deals and profile basics.</p>
          </div>
          <ul>
            <li>3 lifetime free deals</li>
            <li>Core dashboard</li>
            <li>Public creator profile</li>
          </ul>
          {!isPro && <strong className="billing-current">Current plan</strong>}
        </article>

        <article className="billing-plan-card featured">
          <div>
            <span className="billing-label">Pro</span>
            <h3>Creator business OS</h3>
            <p>Unlock the full workspace for serious brand work.</p>
          </div>
          <ul>
            <li>More deal capacity</li>
            <li>Contracts, proof uploads and portfolio workflow</li>
            <li>Intelligence, ROI and deal analyzer tools</li>
          </ul>
          {isPro ? <strong className="billing-current">Current plan: PRO</strong> : <button onClick={() => navigate("/pricing")}>Upgrade</button>}
        </article>
      </section>

      <section className="billing-note">
        <h2>Subscription controls</h2>
        <p>Automatic recurring billing is not enabled here. Use Renew when you want to extend access. This page uses the existing upgrade/payment flow and does not fake cancellation or subscription state changes.</p>
      </section>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}

function getPlanStatus(user) {
  if (!user) return { label: "Loading", detail: "Checking your account..." };
  if (user.plan !== "pro") return { label: "Free plan active", detail: "Upgrade whenever you need Pro workspace features." };
  if (!user.plan_expiry) return { label: "PRO active", detail: "No expiry date is currently stored for this account." };
  const expiry = new Date(user.plan_expiry);
  const days = Math.ceil((expiry - new Date()) / 86400000);
  if (days <= 0) return { label: "PRO expired", detail: `Expired on ${expiry.toLocaleDateString()}.`, expired: true };
  return { label: days <= 7 ? "PRO expiring soon" : "PRO active", detail: `Valid until ${expiry.toLocaleDateString()} (${days} days left).` };
}
