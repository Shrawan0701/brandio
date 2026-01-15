export default function Payment() {
  return (
    <div className="static-page">
      <h1>Pricing</h1>

      <p className="subtitle">
        Simple, transparent pricing built for creators and freelancers worldwide.
      </p>

      {/* INDIA PRICING */}
      <section className="pricing-section">
        <h2 className="region-title">Pricing for India 🇮🇳</h2>
        <p className="region-subtitle">
          Affordable plans tailored for creators based in India.
        </p>

        <div className="pricing-grid">
          <div className="pricing-card">
            <h3>Free</h3>
            <p className="price">₹0</p>
            <p className="billing">Forever</p>
            <ul>
              <li>Up to 5 brand deals</li>
              <li>Basic deal tracking</li>
              <li>Email reminders</li>
              <li>Standard support</li>
            </ul>
          </div>

          <div className="pricing-card ">
            <h3>Pro Monthly</h3>
            <p className="price">₹99</p>
            <p className="billing">per month</p>
            <ul>
              <li>Unlimited brand deals</li>
              <li>Payment & deadline reminders</li>
              <li>Advanced deal analytics</li>
              <li>Email notifications</li>
              <li>Priority email support</li>
              <li>Multi-currency tracking</li>
            </ul>
          </div>

          <div className="pricing-card highlight">
            <h3>Pro Yearly</h3>
            <p className="price">₹499</p>
            <p className="billing">per year</p>
            <ul>
              <li>Everything in Pro Monthly</li>
              <li>Save more than 50% annually</li>
              <li>Early access to new features</li>
              <li>Highest priority support</li>
            </ul>
          </div>
        </div>
      </section>

      {/* GLOBAL PRICING */}
      <section className="pricing-section">
        <h2 className="region-title">Pricing for Global Users </h2>
        <p className="region-subtitle">
          For creators and agencies working with international brands.
        </p>

        <div className="pricing-grid">
          <div className="pricing-card">
            <h3>Free</h3>
            <p className="price">$0</p>
            <p className="billing">Forever</p>
            <ul>
              <li>Up to 5 brand deals</li>
              <li>Basic deal tracking</li>
              <li>Email reminders</li>
              <li>Standard support</li>
            </ul>
          </div>

          <div className="pricing-card ">
            <h3>Pro Monthly</h3>
            <p className="price">$5</p>
            <p className="billing">per month</p>
            <ul>
              <li>Unlimited brand deals</li>
              <li>Payment & deadline reminders</li>
              <li>Advanced deal analytics</li>
              <li>Email notifications</li>
              <li>Priority email support</li>
              <li>Multi-currency tracking</li>
            </ul>
          </div>

          <div className="pricing-card highlight">
            <h3>Pro Yearly</h3>
            <p className="price">$49</p>
            <p className="billing">per year</p>
            <ul>
              <li>Everything in Pro Monthly</li>
              <li>Significant yearly savings</li>
              <li>Early access to new features</li>
              <li>Highest priority support</li>
            </ul>
          </div>
        </div>
      </section>

      {/* PAYMENT INFO */}
      <div className="pricing-footer-note">
        <p>
          Payments in India are securely processed via <strong>Razorpay</strong>.
          International payments are charged in USD using supported Razorpay methods.
        </p>
        <p>
          No hidden charges. Need help? Contact us at{" "}
          <strong>support@brandio.world</strong>.
        </p>
      </div>
    </div>
  );
}
