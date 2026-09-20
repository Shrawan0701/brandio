import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import MarketingFooter from "../components/MarketingFooter";

const indiaPlans = [
  ["Free", "Rs 0", "Forever", "Up to 5 brand deals", "Basic deal tracking", "Email reminders"],
  ["Pro Monthly", "Rs 99", "per month", "Unlimited brand deals", "Payment and deadline reminders", "Advanced deal analytics"],
  ["Pro Yearly", "Rs 499", "per year", "Everything in Pro Monthly", "Save more than 50% annually", "Early access to new features"]
];

const globalPlans = [
  ["Free", "$0", "Forever", "Up to 5 brand deals", "Basic deal tracking", "Email reminders"],
  ["Pro Monthly", "$5", "per month", "Unlimited brand deals", "Payment and deadline reminders", "Advanced deal analytics"],
  ["Pro Yearly", "$49", "per year", "Everything in Pro Monthly", "Yearly savings", "Early access to new features"]
];

export default function Payment() {
  return (
    <>
      <Helmet>
        <title>Brandio Pricing - Plans for Creators & Influencers</title>
        <meta
          name="description"
          content="Brandio pricing plans for creators and influencers. Track brand deals, payments, deadlines, and earnings with affordable monthly and yearly plans."
        />
        <link rel="canonical" href="https://www.brandio.world/pricing" />
      </Helmet>

      <div className="static-page payment-page">
        <section className="payment-hero">
          <span className="mk-eyebrow">Public pricing</span>
          <h1>Simple pricing for creators managing real brand work.</h1>
          <p>Start free, then upgrade when your deals, payments, reminders, and analytics need more room.</p>
          <Link to="/register" className="payment-hero-cta">Start free</Link>
        </section>

        <PricingRegion title="India pricing" subtitle="Affordable INR plans for creators based in India." plans={indiaPlans} featuredIndex={2} />
        <PricingRegion title="Global pricing" subtitle="USD pricing for creators and teams working with international brands." plans={globalPlans} featuredIndex={2} />

        <section className="payment-note">
          <div>
            <span>Secure checkout</span>
            <p>Payments in India are processed via Razorpay. International payments use supported Razorpay methods where available.</p>
          </div>
          <div>
            <span>No surprise billing</span>
            <p>No hidden charges. Need help? Contact support@brandio.world.</p>
          </div>
        </section>
      </div>
      <MarketingFooter />
    </>
  );
}

function PricingRegion({ title, subtitle, plans, featuredIndex }) {
  return (
    <section className="payment-region">
      <div className="payment-region-head">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="payment-plan-grid">
        {plans.map(([name, price, cadence, ...features], index) => (
          <article className={`payment-plan ${index === featuredIndex ? "featured" : ""}`} key={`${title}-${name}`}>
            {index === featuredIndex && <span className="payment-badge">Best value</span>}
            <h3>{name}</h3>
            <div className="payment-price">
              <strong>{price}</strong>
              <span>{cadence}</span>
            </div>
            <ul>
              {features.map((feature) => <li key={feature}>{feature}</li>)}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
