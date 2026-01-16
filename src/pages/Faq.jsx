import { Helmet } from "react-helmet-async";
export default function Faq() {
  return (
<>
    <Helmet>
        <title>Brandio FAQ - Brand Deal & Payment Tracker for Creators</title>
        <meta
          name="description"
          content="Frequently asked questions about Brandio. Learn how creators track brand deals, payments, deadlines, pricing, and security."
        />
        <link rel="canonical" href="https://www.brandio.world/faq" />
      </Helmet> 
    <div className="static-page">
      <h1>Frequently Asked Questions</h1>

      <div className="faq-item">
        <h4>Who is Brandio for?</h4>
        <p>
          Brandio is built for creators, influencers, freelancers, and agencies
          who work with brands and want to manage collaborations professionally.
        </p>
      </div>

      <div className="faq-item">
        <h4>Is there a free plan?</h4>
        <p>
          Yes. You can start for free with limited features and upgrade anytime
          when your workload grows.
        </p>
      </div>

      <div className="faq-item">
        <h4>How do payments work?</h4>
        <p>
          Payments are securely processed via Razorpay. We do not store your card
          or banking details.
        </p>
      </div>

      

      <div className="faq-item">
        <h4>Need help?</h4>
        <p>
          Email us at <strong>support@brandio.world</strong> and we’ll help you
          within 24-48 hours.
        </p>
      </div>
    </div>
    </>
  );
}
