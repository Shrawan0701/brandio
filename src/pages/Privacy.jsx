import { Helmet } from "react-helmet-async";
import MarketingFooter from "../components/MarketingFooter";

const sections = [
  ["Information We Collect", "We collect only the information necessary to provide and improve our services. This may include:", ["Email address and authentication details", "Brand deal data you voluntarily enter", "Basic usage and analytics data"]],
  ["How We Use Your Information", null, ["To operate and maintain the Brandio platform", "To improve product features and performance", "To communicate important updates and support messages"]],
  ["What We Do Not Do", null, ["We do not sell your personal data", "We do not share your data with advertisers", "We do not access your data without permission"]],
  ["Data Security", "We use industry-standard security measures to protect your data. However, no online service can guarantee absolute security."],
  ["Contact", "If you have any questions about this Privacy Policy, contact us at support@brandio.world"]
];

export default function Privacy() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - Brandio</title>
        <meta
          name="description"
          content="Brandio's privacy policy explains how we collect, use, and protect your data while using our platform."
        />
        <link rel="canonical" href="https://www.brandio.world/privacy" />
      </Helmet>

      <LegalPage
        eyebrow="Legal"
        title="Privacy Policy"
        intro="At Brandio, your privacy is important to us. This Privacy Policy explains what information we collect, how we use it, and how we protect your data."
        sections={sections}
      />
      <MarketingFooter />
    </>
  );
}

function LegalPage({ eyebrow, title, intro, sections }) {
  return (
    <div className="static-page legal-page">
      <header className="legal-hero">
        <span className="mk-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{intro}</p>
      </header>
      <div className="legal-layout">
        <aside>
          {sections.map(([heading]) => <a href={`#${heading.replaceAll(" ", "-")}`} key={heading}>{heading}</a>)}
        </aside>
        <main>
          {sections.map(([heading, body, list]) => (
            <section id={heading.replaceAll(" ", "-")} key={heading}>
              <h2>{heading}</h2>
              {body && <p>{body}</p>}
              {list && <ul>{list.map((item) => <li key={item}>{item}</li>)}</ul>}
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}
