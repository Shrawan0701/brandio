import MarketingFooter from "../components/MarketingFooter";

export default function Contact() {
  return (
    <>
      <div className="static-page contact-page">
        <section className="contact-layout">
          <div>
            <span className="mk-eyebrow">Contact</span>
            <h1>Contact Brandio</h1>
            <p>
              Have a question, feedback, or need support? Send a note and the Brandio team will help you with the next step.
            </p>
            <div className="contact-points">
              <span>Product support</span>
              <span>Billing questions</span>
              <span>Creator workflow feedback</span>
            </div>
          </div>

          <aside className="contact-card">
            <span>Support email</span>
            <h2>support@brandio.world</h2>
            <p>Use this email for account help, product questions, feedback, and support requests.</p>
            <a href="mailto:support@brandio.world?subject=Brandio%20Support" className="contact-button">
              Email support
            </a>
            <small>We usually respond within 24-48 hours.</small>
          </aside>
        </section>
      </div>
      <MarketingFooter />
    </>
  );
}
