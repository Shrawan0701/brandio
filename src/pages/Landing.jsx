import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import MarketingFooter from "../components/MarketingFooter";

const workflow = [
  ["01", "Opportunity", "Capture brand interest before it gets buried."],
  ["02", "Deal", "Track campaign scope, value, status, and deadlines."],
  ["03", "Contract", "Keep agreement context attached to the work."],
  ["04", "Deliverables", "Know what needs approval, publishing, or follow-up."],
  ["05", "Publish", "Move work from draft to live without losing context."],
  ["06", "Payment", "See pending, overdue, expected, and earned money."]
];

const features = [
  ["Deal Management", "Campaign, amount, deadline, payment terms, and status in one view."],
  ["Brand CRM", "Relationship context, contacts, notes, and deal history."],
  ["Deliverables", "Upcoming, in progress, completed, and overdue work."],
  ["Money Cockpit", "Earned, pending, overdue, and expected collaboration income."],
  ["Contracts", "Documents and signing status beside the deal."],
  ["AI Deal Intelligence", "Analyze deal value, risk, and next actions."],
  ["Rate Intelligence", "Make pricing decisions with more context."],
  ["Portfolio", "Present selected work with brand context."],
  ["Media Kit", "Publish a professional creator business profile."],
  ["Inbound", "Turn brand interest into organized opportunities."],
  ["Analytics", "Understand momentum across revenue and collaborations."]
];

const faqs = [
  ["Who is Brandio for?", "Brandio is built for creators, influencers, freelancers, and creator teams who manage brand collaborations."],
  ["Can I start free?", "Yes. You can start free and upgrade when you need more advanced creator-business tools."],
  ["Does Brandio replace spreadsheets?", "Brandio gives brand deals, deliverables, payments, contracts, and opportunities a structured home so you do not have to run the workflow across scattered tools."],
  ["How are payments processed?", "Plan payments are processed through Razorpay. Brandio does not store card or banking details."]
];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(0);
  const [workflowIndex, setWorkflowIndex] = useState(0);
  const [workflowPaused, setWorkflowPaused] = useState(false);
  const touchStartX = useRef(null);
  const visibleWorkflow = [0, 1, 2].map((offset) => workflow[(workflowIndex + offset) % workflow.length]);
  const nextWorkflow = () => setWorkflowIndex((index) => (index + 1) % workflow.length);
  const prevWorkflow = () => setWorkflowIndex((index) => (index - 1 + workflow.length) % workflow.length);

  useEffect(() => {
    if (workflowPaused) return undefined;
    const timer = window.setInterval(nextWorkflow, 3600);
    return () => window.clearInterval(timer);
  }, [workflowPaused]);

  const handleWorkflowTouchStart = (event) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
    setWorkflowPaused(true);
  };

  const handleWorkflowTouchEnd = (event) => {
    const start = touchStartX.current;
    const end = event.changedTouches[0]?.clientX ?? null;
    touchStartX.current = null;
    if (start != null && end != null && Math.abs(start - end) > 36) {
      if (start > end) nextWorkflow();
      else prevWorkflow();
    }
    window.setTimeout(() => setWorkflowPaused(false), 900);
  };

  return (
    <div className="marketing-site">
      <section className="mk-hero">
        <div className="mk-hero-copy">
          <span className="mk-eyebrow">The business OS for creators</span>
          <h1>Your <span>creator business</span>, finally in one place.</h1>
          <p>
            <span className="hero-copy-desktop">Manage brand deals, deliverables, contracts, payments, and opportunities from one powerful workspace.</span>
            <span className="hero-copy-mobile">Manage deals, payments, deliverables, and opportunities in one workspace.</span>
          </p>
          <div className="mk-hero-actions">
            <Link to="/register" className="mk-btn primary">Start free</Link>
            <a href="#workflow" className="mk-btn secondary">See how it works</a>
          </div>
          <small>Built for creators who treat collaborations like a real business.</small>
        </div>

        <HeroProductMockup />
      </section>

      <section className="mk-trust">
        <p>Built for creators who manage serious collaboration workflows</p>
        <div>
          <span>Deals</span>
          <span>Deliverables</span>
          <span>Contracts</span>
          <span>Money</span>
          <span>Media Kit</span>
          <span>AI</span>
        </div>
      </section>

      <section className="mk-problem">
        <div>
          <span className="mk-eyebrow">The old way</span>
          <h2>Your business is growing. Your workflow should not be falling apart.</h2>
          <p>Brand collaborations usually start in one place, move through three more, and get paid somewhere else. Brandio turns that scattered work into a single lifecycle.</p>
        </div>
        <div className="mk-chaos-board">
          {["Instagram DMs", "Email threads", "Spreadsheets", "Notes", "Contracts", "Invoices", "Payment reminders"].map((item, index) => (
            <div className={`mk-mini-card c${index}`} key={item}>
              <span>{item.slice(0, 2).toUpperCase()}</span>
              <strong>{item}</strong>
            </div>
          ))}
          <div className="mk-brandio-core">
            <b>Brandio</b>
            <small>One collaboration workspace</small>
          </div>
        </div>
      </section>

      <section className="mk-workflow" id="workflow">
        <div className="mk-section-head">
          <span className="mk-eyebrow">Workflow</span>
          <h2>From first opportunity to final payment.</h2>
        </div>
        <div
          className="mk-workflow-carousel"
          onMouseEnter={() => setWorkflowPaused(true)}
          onMouseLeave={() => setWorkflowPaused(false)}
          onFocus={() => setWorkflowPaused(true)}
          onBlur={() => setWorkflowPaused(false)}
          onTouchStart={handleWorkflowTouchStart}
          onTouchEnd={handleWorkflowTouchEnd}
        >
          <button onClick={prevWorkflow} aria-label="Previous workflow step">←</button>
          <div className="mk-workflow-window">
            {visibleWorkflow.map(([number, title, text], index) => (
              <article className={index === 0 ? "active" : "is-secondary"} key={`${number}-${title}`}>
                <span>{number} / {title}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <button onClick={nextWorkflow} aria-label="Next workflow step">→</button>
        </div>
        <div className="mk-workflow-dots" aria-label={`Workflow step ${workflowIndex + 1} of ${workflow.length}`}>
          {workflow.map(([, title], index) => (
            <button
              className={index === workflowIndex ? "active" : ""}
              onClick={() => setWorkflowIndex(index)}
              aria-label={`Show ${title}`}
              key={title}
            />
          ))}
        </div>
      </section>

      <section className="mk-showcase" id="product">
        <ProductBlock
          eyebrow="01 Deals"
          title="Every collaboration, under control."
          text="See the brand, campaign, value, deadline, next action, and payment status without hunting through old messages."
          visual={<DealMockup />}
        />
        <ProductBlock
          eyebrow="02 Money Cockpit"
          title="Know what you have earned. Know what is coming next."
          text="Separate earned, pending, overdue, and expected money so brand work feels financially organized."
          visual={<MoneyMockup />}
          flip
        />
        <ProductBlock
          eyebrow="03 Deliverables"
          title="Never lose track of what needs to go live."
          text="Track content requirements, approval state, campaign context, due dates, and overdue work."
          visual={<DeliverableMockup />}
        />
        <ProductBlock
          eyebrow="04 Brand CRM"
          title="Turn every collaboration into a relationship."
          text="Keep brand contacts, notes, history, and revenue context together for future work."
          visual={<BrandMockup />}
          flip
        />
      </section>

      <section className="mk-ai">
        <div>
          <span className="mk-eyebrow">Brandio Intelligence</span>
          <h2>Meet the intelligence layer behind your creator business.</h2>
          <p>Analyze deal quality, payment terms, effective rates, risks, and suggested responses without turning your workflow into a chatbot.</p>
        </div>
        <div className="mk-ai-panel">
          <span>AI Deal Analyzer</span>
          <h3>Is this campaign worth accepting?</h3>
          <div className="mk-ai-grid">
            <Metric label="Deal value" value="$1,200" />
            <Metric label="Deliverables" value="4 items" />
            <Metric label="Effective rate" value="$300/item" />
            <Metric label="Payment terms" value="Net 30" />
          </div>
          <div className="mk-risk">Risk: payment date is after all content goes live. Suggested next step: ask for milestone or partial upfront payment.</div>
        </div>
      </section>

      <section className="mk-media">
        <div className="mk-media-card">
          <div className="mk-media-hero">
            <div className="mk-avatar">CR</div>
            <div>
              <h3>Creator Name</h3>
              <p>Beauty and lifestyle creator helping brands launch practical, high-converting campaigns.</p>
            </div>
          </div>
          <div className="mk-media-stats">
            <div><span>Niche</span><strong>Lifestyle</strong></div>
            <div><span>Services</span><strong>UGC, Reels</strong></div>
            <div><span>Brands</span><strong>Featured</strong></div>
          </div>
          <div className="mk-work-grid">
            <span><b>Selected Work</b><small>Reels campaign</small></span>
            <span><b>Starting Rate</b><small>Available on request</small></span>
            <span><b>Contact</b><small>Work With Me</small></span>
          </div>
        </div>
        <div>
          <span className="mk-eyebrow">Media Kit</span>
          <h2>Your work deserves more than a link in your bio.</h2>
          <p>Create a premium public profile with services, rates, selected work, featured brands, and a clear contact path.</p>
          <Link to="/register" className="mk-btn primary">Create your media kit</Link>
        </div>
      </section>

      <section className="mk-inbound">
        <div className="mk-section-head">
          <span className="mk-eyebrow">Inbound Opportunities</span>
          <h2>Turn brand interest into organized opportunities.</h2>
        </div>
        <div className="mk-inbound-grid">
          <div className="mk-inquiry">
            <span>New collaboration</span>
            <h3>Skincare launch campaign</h3>
            <p>Budget, deliverables, contact, message, status, and next action all stay attached.</p>
            <b>$2,500 budget</b>
          </div>
          <div className="mk-status-flow">
            {["New", "Reviewing", "Negotiating", "Accepted"].map((status) => <span key={status}>{status}</span>)}
          </div>
        </div>
      </section>

      <section className="mk-features">
        <div className="mk-section-head">
          <span className="mk-eyebrow">Feature overview</span>
          <h2>One operating system for the business side of creating.</h2>
        </div>
        <div className="mk-feature-showcase">
          <article className="mk-feature-editorial">
            <div>
              <span className="mk-eyebrow">Deal management</span>
              <h3>Run every collaboration like a real pipeline.</h3>
              <p>Keep campaign scope, value, status, contract context and delivery dates in one working view.</p>
            </div>
            <DealMockup />
          </article>
          <article className="mk-feature-split">
            <MoneyMockup />
            <div>
              <span className="mk-eyebrow">Money</span>
              <h3>Separate earned, pending and overdue income.</h3>
              <p>Brandio keeps the financial side of creator work visible without inventing numbers or hiding behind dashboards.</p>
            </div>
          </article>
          <article className="mk-feature-ai-strip">
            <div>
              <span className="mk-eyebrow">AI workspace</span>
              <h3>Analyze a deal before you say yes.</h3>
              <p>Review deal terms, payment timing, deliverables, risks and negotiation angles in a focused workspace.</p>
            </div>
            <div className="mk-ai-mini">
              <b>Extracted terms</b>
              <span>4 deliverables</span>
              <span>Usage rights requested</span>
              <span>Payment after publishing</span>
            </div>
          </article>
          <article className="mk-feature-duo">
            <div>
              <span className="mk-eyebrow">Inbound</span>
              <h3>Turn interest into opportunities.</h3>
              <p>Inquiry status, budget, campaign details and next actions stay together.</p>
            </div>
            <div>
              <span className="mk-eyebrow">Media kit</span>
              <h3>Show selected work with business context.</h3>
              <p>Publish a creator profile that helps brands understand what you offer.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="mk-different">
        <div className="mk-column scattered">
          <span>Scattered workflow</span>
          {["DMs", "Spreadsheet", "Email", "Notes", "Invoice", "Calendar"].map((item) => <b key={item}>{item}</b>)}
        </div>
        <div className="mk-arrow">to</div>
        <div className="mk-column unified">
          <span>Brandio</span>
          {["Deals", "Brands", "Deliverables", "Contracts", "Money", "AI", "Media Kit"].map((item) => <b key={item}>{item}</b>)}
        </div>
      </section>

      <section className="mk-pricing">
        <div>
          <span className="mk-eyebrow">Pricing</span>
          <h2>Start simple. Upgrade when your creator business needs more room.</h2>
          <p>Keep the same Brandio workflow while choosing the plan that fits your current stage.</p>
        </div>
        <div className="mk-price-card">
          <span>Creator</span>
          <h3>Free to start</h3>
          <p>Track your workflow, then upgrade for more advanced business tools.</p>
          <Link to="/payment" className="mk-btn primary">View pricing</Link>
        </div>
      </section>

      <section className="mk-faq">
        <div className="mk-section-head">
          <span className="mk-eyebrow">FAQ</span>
          <h2>Questions creators ask before switching.</h2>
        </div>
        <div className="mk-faq-list">
          {faqs.map(([question, answer], index) => (
            <button className={openFaq === index ? "open" : ""} onClick={() => setOpenFaq(openFaq === index ? -1 : index)} key={question}>
              <strong>{question}</strong>
              <p>{answer}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="mk-final">
        <h2>Run your creator business like a real business.</h2>
        <p>Deals, money, deliverables, brands, and opportunities, all in one place.</p>
        <Link to="/register" className="mk-btn primary">Start free</Link>
      </section>

      <MarketingFooter />
    </div>
  );
}

function featureLabel(title) {
  return title
    .replace(" Management", "")
    .replace(" Cockpit", "")
    .replace("AI Deal Intelligence", "AI")
    .toUpperCase();
}

function HeroProductMockup() {
  return (
    <div className="mk-product-frame">
      <div className="mk-browser">
        <span />
        <span />
        <span />
      </div>
      <div className="mk-dashboard">
        <div className="mk-dashboard-main">
          <Metric label="Revenue this month" value="$8,240" />
          <Metric label="Active deals" value="12" />
          <Metric label="Pending payments" value="$3,600" />
          <div className="mk-chart">
            {[35, 58, 44, 76, 62, 90].map((height, index) => <i style={{ height: `${height}%` }} key={index} />)}
          </div>
        </div>
        <div className="mk-dashboard-side">
          <h3>Upcoming</h3>
          <p>Reel draft due tomorrow</p>
          <p>Contract awaiting signature</p>
          <p>Payment follow-up due</p>
        </div>
        <div className="mk-pipeline">
          {["New", "Negotiating", "Active", "Payment"].map((stage) => <span key={stage}>{stage}</span>)}
        </div>
      </div>
    </div>
  );
}

function ProductBlock({ eyebrow, title, text, visual, flip }) {
  return (
    <article className={`mk-product-block ${flip ? "flip" : ""}`}>
      <div>
        <span className="mk-eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      {visual}
    </article>
  );
}

function Metric({ label, value }) {
  return (
    <div className="mk-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DealMockup() {
  return (
    <div className="mk-ui-card">
      <h3>Deal Workspace</h3>
      {["Nova Beauty", "AeroFit", "Studio Home"].map((brand, index) => (
        <div className="mk-row" key={brand}>
          <b>{brand}</b>
          <span>{["Reels package", "Launch video", "UGC bundle"][index]}</span>
          <em>{["$1,200", "$2,400", "$850"][index]}</em>
          <i>{["Active", "Pending", "Paid"][index]}</i>
        </div>
      ))}
    </div>
  );
}

function MoneyMockup() {
  return (
    <div className="mk-ui-card dark">
      <h3>Money Cockpit</h3>
      <div className="mk-money-grid">
        <Metric label="Earned" value="$12.8k" />
        <Metric label="Pending" value="$4.2k" />
        <Metric label="Overdue" value="$900" />
        <Metric label="Expected" value="$7.1k" />
      </div>
      <div className="mk-line-chart" />
    </div>
  );
}

function DeliverableMockup() {
  return (
    <div className="mk-ui-card">
      <h3>Deliverables</h3>
      {["Draft script", "Instagram Reel", "Usage rights approval"].map((item, index) => (
        <div className="mk-task" key={item}>
          <span>{item}</span>
          <b>{["In progress", "Due Friday", "Completed"][index]}</b>
          <i><em style={{ width: `${[45, 70, 100][index]}%` }} /></i>
        </div>
      ))}
    </div>
  );
}

function BrandMockup() {
  return (
    <div className="mk-ui-card">
      <h3>Brand CRM</h3>
      {["Nova Beauty", "Craft Coffee", "AeroFit"].map((brand, index) => (
        <div className="mk-brand-row" key={brand}>
          <span>{brand.slice(0, 1)}</span>
          <div>
            <b>{brand}</b>
            <small>{[4, 2, 1][index]} collaborations</small>
          </div>
          <em>{["$6.4k", "$2.1k", "$2.4k"][index]}</em>
        </div>
      ))}
    </div>
  );
}
