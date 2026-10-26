import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import MarketingFooter from "../components/MarketingFooter";
import { getPaidPlans, PRO_FEATURES } from "../utils/pricing";

export default function Payment() {
  return (
    <>
      <Helmet>
        <title>Brandio Pricing - Plans for Creators & Influencers</title>
        <meta
          name="description"
          content="Brandio Pro monthly, quarterly and yearly plans for creators. Start with 1 lifetime free deal and access every feature."
        />
        <link rel="canonical" href="https://www.brandio.world/pricing" />
      </Helmet>

      <div className="static-page payment-page">
        <section className="payment-hero">
          <span className="mk-eyebrow">Public pricing</span>
          <h1>Simple pricing for creators managing real brand work.</h1>
          <p>Try 1 lifetime free deal with every feature. Choose Pro for unlimited deals with the same full workspace.</p>
          <Link to="/register" className="payment-hero-cta">Start free</Link>
        </section>

        <PricingRegion title="India pricing" subtitle="INR plans for creators based in India." plans={getPaidPlans("IN")} />
        <PricingRegion title="Global pricing" subtitle="USD plans for creators outside India." plans={getPaidPlans("US")} />

        <section className="payment-note">
          <div>
            <span>Secure checkout</span>
            <p>Payments in India are processed via Razorpay. International payments use supported Razorpay methods where available.</p>
          </div>
          <div>
            <span>No surprise billing</span>
            <p>Renew manually with no automatic recurring billing. Deleting a deal does not reset your free allowance. Need help? Contact support@brandio.world.</p>
          </div>
        </section>
      </div>
      <MarketingFooter />
    </>
  );
}

function PricingRegion({ title, subtitle, plans }) {
  return (
    <section className="payment-region">
      <div className="payment-region-head">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="payment-plan-grid">
        {plans.map((plan) => (
          <article className={`payment-plan ${plan.featured ? "featured" : ""}`} key={`${title}-${plan.id}`}>
            {plan.badge && <span className="payment-badge">{plan.badge}</span>}
            <h3>{plan.name}</h3>
            <div className="payment-price">
              <strong>{plan.price}</strong>
              <span>{plan.cadence}</span>
            </div>
            <ul>
              {PRO_FEATURES.map((feature) => <li key={feature}>{feature}</li>)}
            </ul>
            <Link to="/pricing">Choose {plan.name.replace("Pro ", "")}</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
