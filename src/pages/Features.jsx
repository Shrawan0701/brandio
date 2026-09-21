import { Link } from "react-router-dom";
import MarketingFooter from "../components/MarketingFooter";

const features = [
  ["Deal Management", "Track every collaboration from first conversation to final payment.", "Brand, campaign, value, deadline, status, next action"],
  ["Deliverables", "See what needs drafting, approval, publishing, and follow-up.", "Upcoming, in progress, completed, overdue"],
  ["Brand CRM", "Keep relationship history and brand context in one lightweight workspace.", "Contacts, notes, deal history, revenue"],
  ["Money", "Understand earned, pending, overdue, and expected collaboration income.", "Cash flow, payments, timelines"],
  ["Contracts", "Keep agreement context close to the deal and deliverables.", "Signing state, dates, document actions"],
  ["AI Deal Intelligence", "Analyze deal value, risks, payment terms, and recommendations.", "Deal analysis, rate intelligence, insights"],
  ["Portfolio", "Show selected work with brand and project context.", "Projects, thumbnails, categories"],
  ["Media Kit", "Create a premium public profile for brand collaborations.", "Services, rates, proof, contact CTA"],
  ["Inbound", "Turn incoming brand interest into a clear workflow.", "New, reviewing, negotiating, accepted"]
];

export default function Features() {
  return (
    <div className="static-page marketing-static">
      <span className="mk-eyebrow">Brandio Features</span>
      <h1>The operating system for creator collaborations.</h1>
      <p className="subtitle">
        Brandio brings deals, brands, deliverables, contracts, money, intelligence, and your public profile into one creator-business workspace.
      </p>

      <div className="feature-editorial">
        {features.map(([title, text, detail], index) => (
          <section className={index % 2 ? "flip" : ""} key={title}>
            <div>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h2>{title}</h2>
              <p>{text}</p>
              <small>{detail}</small>
            </div>
            <FeaturePreview title={title} />
          </section>
        ))}
      </div>

      <section className="static-cta">
        <h2>Start running brand work from one place.</h2>
        <Link to="/register" className="mk-btn primary">Start free</Link>
      </section>
      <MarketingFooter />
    </div>
  );
}

function FeaturePreview({ title }) {
  const rows = previewRows[title] || previewRows["Deal Management"];

  return (
    <div className="feature-visual">
      <b>{title}</b>
      <div className="feature-preview-list">
        {rows.map((row) => (
          <div className="feature-preview-row" key={`${title}-${row[0]}`}>
            <span>{row[0]}</span>
            <strong>{row[1]}</strong>
            <em>{row[2]}</em>
          </div>
        ))}
      </div>
    </div>
  );
}

const previewRows = {
  "Deal Management": [["Brand campaign", "₹25,000", "Active"], ["Creator campaign", "₹18,500", "Awaiting payment"], ["Travel partnership", "₹42,000", "Completed"]],
  Deliverables: [["Reel draft", "Due Friday", "In progress"], ["Usage approval", "Today", "Review"], ["Final post", "Next week", "Scheduled"]],
  "Brand CRM": [["Nova Beauty", "4 deals", "Warm"], ["AeroFit", "1 deal", "New"], ["Craft Coffee", "2 deals", "Repeat"]],
  "Money": [["Earned", "₹82,000", "Recorded"], ["Pending", "₹31,500", "Open"], ["Overdue", "₹8,000", "Follow up"]],
  Contracts: [["Usage rights", "Signed", "Stored"], ["Launch deal", "Awaiting", "Signature"], ["Retainer", "Expires", "Soon"]],
  "AI Deal Intelligence": [["Effective rate", "₹6,250/item", "Good"], ["Payment terms", "Net 30", "Risk"], ["Suggested reply", "Ready", "Draft"]],
  Portfolio: [["UGC project", "Beauty", "Featured"], ["Reel campaign", "Fitness", "Live"], ["Launch edit", "Travel", "Selected"]],
  "Media Kit": [["Niche", "Lifestyle", "Public"], ["Services", "UGC, Reels", "Visible"], ["Brands", "Featured", "Proof"]],
  Inbound: [["Skincare launch", "₹45,000", "New"], ["Apparel collab", "Reviewing", "Next action"], ["Travel inquiry", "Negotiating", "Open"]]
};
