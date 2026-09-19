import { useState } from "react";
import { Helmet } from "react-helmet-async";
import MarketingFooter from "../components/MarketingFooter";

const items = [
  ["Who is Brandio for?", "Brandio is built for creators, influencers, freelancers, and agencies who work with brands and want to manage collaborations professionally."],
  ["Is there a free plan?", "Yes. You can start for free with limited features and upgrade anytime when your workload grows."],
  ["How do payments work?", "Payments are securely processed via Razorpay. We do not store your card or banking details."],
  ["What can I manage in Brandio?", "You can manage deals, brands, deliverables, contracts, payments, inbound opportunities, portfolio items, media kit details, and business insights."],
  ["Need help?", "Email support@brandio.world and the team will help you within 24-48 hours."]
];

export default function Faq() {
  const [open, setOpen] = useState(0);

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

      <div className="static-page marketing-static faq-page">
        <span className="mk-eyebrow">FAQ</span>
        <h1>Questions before you move your creator business into Brandio.</h1>
        <p className="subtitle">Clear answers about plans, payments, workflows, and support.</p>

        <div className="mk-faq-list">
          {items.map(([question, answer], index) => (
            <button className={open === index ? "open" : ""} onClick={() => setOpen(open === index ? -1 : index)} key={question}>
              <strong>{question}</strong>
              <p>{answer}</p>
            </button>
          ))}
        </div>
      </div>
      <MarketingFooter />
    </>
  );
}
