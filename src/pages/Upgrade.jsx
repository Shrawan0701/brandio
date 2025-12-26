import { Link } from "react-router-dom";
import "../styles/pricing.css";

export default function Upgrade() {
  return (
    <div className="pricing-page">
      {/* ================= HEADER ================= */}
      <header className="pricing-hero">
        <h1>
          Simple pricing for <span>creators</span>
        </h1>
        <p>
          Start free. Upgrade only when brand deals become real money.
        </p>
      </header>

      {/* ================= CARDS ================= */}
      <section className="pricing-grid">
        {/* FREE */}
        <div className="pricing-card">
          <h3>Free</h3>
          <div className="price">₹0</div>
          <p className="price-note">Forever free</p>

          <ul>
            <li>✔ Track up to 5 brand deals</li>
            <li>✔ Payment due dates</li>
            <li>✔ Deal status tracking</li>
            <li>✖ No reminders</li>
            <li>✖ No analytics</li>
          </ul>

          <Link to="/register" className="btn-outline">
            Start free
          </Link>
        </div>

        {/* CREATOR */}
        <div className="pricing-card highlight">
          <div className="badge">Most Popular</div>
          <h3>Creator</h3>
          <div className="price">₹199</div>
          <p className="price-note">per month</p>

          <ul>
            <li>✔ Unlimited brand deals</li>
            <li>✔ Payment reminders</li>
            <li>✔ Deal analytics</li>
            <li>✔ Brand & platform insights</li>
            <li>✔ Priority support</li>
          </ul>

          <Link to="/register" className="btn-primary">
            Upgrade
          </Link>
        </div>

        {/* PRO */}
        <div className="pricing-card">
          <h3>Pro</h3>
          <div className="price">₹499</div>
          <p className="price-note">per month</p>

          <ul>
            <li>✔ Everything in Creator</li>
            <li>✔ Advanced analytics</li>
            <li>✔ Export reports</li>
            <li>✔ Tax-ready summaries</li>
            <li>✔ Faster payouts tracking</li>
          </ul>

          <Link to="/register" className="btn-outline">
            Go Pro
          </Link>
        </div>

        {/* AGENCY */}
        <div className="pricing-card">
          <h3>Agency</h3>
          <div className="price">Custom</div>
          <p className="price-note">For teams & managers</p>

          <ul>
            <li>✔ Manage multiple creators</li>
            <li>✔ Team access</li>
            <li>✔ Custom reports</li>
            <li>✔ Dedicated support</li>
            <li>✔ SLA & onboarding</li>
          </ul>

          <a
            href="mailto:sales@brandio.app"
            className="btn-outline"
          >
            Contact sales
          </a>
        </div>
      </section>

      {/* ================= FOOTER NOTE ================= */}
      <section className="pricing-footer">
        <p>
          Prices shown in INR. International pricing is auto-converted at
          checkout.
        </p>
        <p>No credit card required to start.</p>
      </section>
    </div>
  );
}
