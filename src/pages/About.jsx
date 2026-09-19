import { Helmet } from "react-helmet-async";
import MarketingFooter from "../components/MarketingFooter";

export default function About() {
  return (
    <>
      <Helmet>
        <title>About Brandio - Brand Deal Tracker for Creators</title>
        <meta
          name="description"
          content="Brandio is a professional brand deal tracker built for creators, influencers, and freelancers to manage collaborations, payments, and earnings in one place."
        />
        <link rel="canonical" href="https://www.brandio.world/about" />
      </Helmet>

      <div className="static-page about-page">
        <section className="about-hero">
          <span className="mk-eyebrow">Brandio</span>
          <h1>The Business OS for Creators.</h1>
          <p>
            Brandio helps creators, influencers, and freelancers manage brand collaborations like a real business, not a messy side hustle.
          </p>
        </section>

        <section className="about-story">
          <div>
            <h2>Why Brandio exists</h2>
            <p>
              Most creators track deals using spreadsheets, WhatsApp chats, emails, or random notes. This often leads to missed deadlines, unpaid invoices, and confusion around deliverables.
            </p>
            <p>
              Brandio replaces that chaos with a single, structured dashboard for collaboration details, deliverables, contracts, payments, and opportunities.
            </p>
          </div>
          <div className="about-principles">
            {["One workspace", "Creator-first workflow", "Clear financial visibility", "Less admin", "Better organization"].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </section>

        <section className="about-capabilities">
          <h2>What you can do with Brandio</h2>
          <ul>
            <li>Track brand deals and collaborations</li>
            <li>Monitor payments, earnings, and due dates</li>
            <li>Manage deliverables and deadlines</li>
            <li>Stay organized without spreadsheets</li>
          </ul>
          <p>
            Brandio is continuously evolving based on feedback from creators. The goal is simple: make brand deal management effortless.
          </p>
        </section>
      </div>
      <MarketingFooter />
    </>
  );
}
