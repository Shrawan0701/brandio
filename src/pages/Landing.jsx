import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import MarketingFooter from "../components/MarketingFooter";

const revenueData = [
  { month: "Jan", revenue: 2400, deals: 2 },
  { month: "Feb", revenue: 3600, deals: 3 },
  { month: "Mar", revenue: 3100, deals: 2 },
  { month: "Apr", revenue: 5200, deals: 5 },
  { month: "May", revenue: 4700, deals: 4 },
  { month: "Jun", revenue: 6900, deals: 6 },
  { month: "Jul", revenue: 8100, deals: 7 },
  { month: "Aug", revenue: 7600, deals: 5 }
];

const workflow = ["Opportunity", "Deal", "Contract", "Deliverables", "Payment", "Portfolio"];

export default function Landing() {
  const [activeMonth, setActiveMonth] = useState(5);
  const [activeFlow, setActiveFlow] = useState(1);

  useEffect(() => {
    const revealables = document.querySelectorAll(".bl-reveal");
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")),
      { threshold: 0.16 }
    );
    revealables.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setActiveFlow((index) => (index + 1) % workflow.length), 2800);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="brandio-landing">
      <section className="bl-hero bl-reveal">
        <div className="bl-hero-copy">
          <span className="bl-kicker">Brandio for creator operators</span>
          <h1>The business layer between your inbox and your income.</h1>
          <p>Run brand work through one polished workspace for opportunities, deal terms, contracts, deliverables, payments, and public proof.</p>
          <div className="bl-actions">
            <Link to="/register" className="bl-btn bl-btn-primary">Start free</Link>
            <a href="#product" className="bl-btn bl-btn-text">Explore product</a>
          </div>
        </div>
        <HeroConsole />
      </section>

      <section className="bl-problem bl-reveal">
        <div className="bl-section-copy narrow">
          <span className="bl-kicker">The scattered middle</span>
          <h2>Brand work rarely breaks in one place. It frays between all the places.</h2>
        </div>
        <ChaosMap />
      </section>

      <section className="bl-dark-showcase bl-reveal" id="product">
        <div className="bl-section-copy inverted">
          <span className="bl-kicker">Product command center</span>
          <h2>A real operating view for every collaboration in motion.</h2>
        </div>
        <ProductBoard />
      </section>

      <section className="bl-deals bl-reveal">
        <DealDesk />
        <div className="bl-section-copy compact">
          <span className="bl-kicker">Deals</span>
          <h2>Negotiate, activate, deliver, and collect without losing context.</h2>
          <p>Brandio treats each deal as a working record: brand, scope, value, deadlines, contract status, delivery progress, and payment health.</p>
        </div>
      </section>

      <section className="bl-analytics bl-reveal">
        <div className="bl-section-copy compact">
          <span className="bl-kicker">Analytics</span>
          <h2>Revenue momentum with readable context.</h2>
          <p>Hover the chart to inspect monthly revenue and deal count. It is a product view, not an empty dashboard prop.</p>
        </div>
        <RevenueChart activeMonth={activeMonth} setActiveMonth={setActiveMonth} />
      </section>

      <section className="bl-deliverables bl-reveal">
        <div className="bl-section-copy compact">
          <span className="bl-kicker">Deliverables</span>
          <h2>Campaign obligations in calendar form.</h2>
        </div>
        <DeliverableTimeline />
      </section>

      <section className="bl-contracts bl-reveal">
        <ContractAnalyzer />
        <div className="bl-section-copy compact">
          <span className="bl-kicker">Contracts + analyzer</span>
          <h2>Extract the deal hiding inside the document.</h2>
          <p>Review payment terms, usage rights, deadlines, exclusivity, and risk before a campaign becomes a problem.</p>
        </div>
      </section>

      <section className="bl-media bl-reveal">
        <div className="bl-section-copy compact">
          <span className="bl-kicker">Media kit</span>
          <h2>A public creator profile that feels like a business surface.</h2>
          <p>Give brands a clean view of your audience, work, services, rates, and collaboration path.</p>
          <Link to="/register" className="bl-media-cta">Create your media kit</Link>
        </div>
        <MediaKitPreview />
      </section>

      <section className="bl-inbound bl-reveal">
        <InboundFlow />
        <div className="bl-section-copy compact">
          <span className="bl-kicker">Inbound</span>
          <h2>Brand interest becomes a tracked opportunity.</h2>
          <p>Inquiry details, budget, decision status, deal creation, and payment all stay connected.</p>
        </div>
      </section>

      <section className="bl-relationships bl-reveal">
        <div className="bl-section-copy compact">
          <span className="bl-kicker">Brand relationships</span>
          <h2>History is leverage.</h2>
          <p>See relationship notes, past campaigns, revenue, contacts, and the next useful follow-up in one editorial CRM view.</p>
        </div>
        <RelationshipLedger />
      </section>

      <section className="bl-workflow bl-reveal">
        <div className="bl-section-copy centered">
          <span className="bl-kicker">Workflow</span>
          <h2>One flowing lifecycle, not six disconnected tools.</h2>
        </div>
        <div className="bl-flowline" aria-label="Brandio workflow">
          {workflow.map((step, index) => (
            <button className={activeFlow === index ? "active" : ""} onClick={() => setActiveFlow(index)} key={step}>
              <span>{step}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="bl-final bl-reveal">
        <div>
          <span className="bl-kicker">Start clean</span>
          <h2>Put the business side of creating somewhere worthy of the work.</h2>
          <Link to="/register" className="bl-btn bl-btn-primary light">Start free</Link>
        </div>
        <FinalMiniUi />
      </section>

      <MarketingFooter />
    </div>
  );
}

function HeroConsole() {
  return (
    <div className="bl-console" aria-label="Brandio dashboard preview">
      <div className="bl-console-top"><b>Brandio</b><span>Live workspace</span></div>
      <div className="bl-console-grid">
        <div className="bl-pipeline-panel">
          <div className="bl-panel-title"><span>Deals</span><b>$18.4k active</b></div>
          {["Nova Beauty", "AeroFit", "Hearth Studio"].map((brand, index) => (
            <div className="bl-deal-row" key={brand}>
              <i>{brand.slice(0, 1)}</i><strong>{brand}</strong><span>{["Contract", "Delivering", "Payment"][index]}</span><em>{["$4,200", "$7,800", "$2,100"][index]}</em>
            </div>
          ))}
        </div>
        <div className="bl-next-panel">
          <span>Next action</span><strong>Approve Reel draft</strong><p>Skincare launch campaign due Friday</p>
        </div>
        <div className="bl-mini-chart">
          <div className="bl-chart-head"><span>Revenue</span><b>$8.1k</b></div>
          <div className="bl-chart-bars">
            {[42, 64, 50, 78, 69, 92].map((h, i) => <i style={{ height: `${h}%` }} key={i} />)}
          </div>
          <div className="bl-chart-meta"><span>Paid 62%</span><span>Pending 38%</span></div>
        </div>
      </div>
    </div>
  );
}

function ChaosMap() {
  const nodes = ["Instagram DM", "Email", "Rate sheet", "Calendar", "Contract PDF", "Payment note", "Approval thread"];
  return <div className="bl-chaos-map">{nodes.map((node, index) => <span className={`n${index}`} key={node}>{node}</span>)}<b>Brandio workspace</b></div>;
}

function ProductBoard() {
  return <div className="bl-product-board"><aside><b>Deals</b><b>Deliverables</b><b>Payments</b><b>Contracts</b></aside><main><div className="bl-board-head"><span>Nova Beauty launch</span><strong>$4,200</strong></div><div className="bl-board-columns"><section><h3>Deal</h3><p>3 Reels, 6 stories, 30-day usage</p></section><section><h3>Deliverables</h3><p>2 approved, 1 scheduled</p></section><section><h3>Payment</h3><p>50% upfront received</p></section></div></main></div>;
}

function DealDesk() {
  return <div className="bl-deal-desk"><div className="bl-table-head"><span>Brand</span><span>Stage</span><span>Due</span><span>Value</span></div>{[["Luma Skin", "Negotiating", "Sep 28", "$3,600"], ["AeroFit", "Delivering", "Oct 04", "$7,800"], ["Field Notes", "Awaiting contract", "Oct 12", "$2,450"]].map((row) => <div className="bl-table-row" key={row[0]}>{row.map((cell) => <span key={cell}>{cell}</span>)}</div>)}</div>;
}

function RevenueChart({ activeMonth, setActiveMonth }) {
  const max = Math.max(...revenueData.map((d) => d.revenue));
  const points = revenueData.map((d, i) => `${(i / (revenueData.length - 1)) * 100},${100 - (d.revenue / max) * 82 - 8}`).join(" ");
  const active = revenueData[activeMonth];
  const x = (activeMonth / (revenueData.length - 1)) * 100;
  const y = 100 - (active.revenue / max) * 82 - 8;
  return <div className="bl-chart-wrap"><svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Revenue chart"><g className="grid">{[20,40,60,80].map((v) => <line x1="0" x2="100" y1={v} y2={v} key={v} />)}</g><polyline points={points} /><circle cx={x} cy={y} r="1.8" /></svg><div className="bl-chart-tooltip" style={{ left: `${x}%`, top: `${y}%` }}><b>${active.revenue.toLocaleString()}</b><span>{active.month} · {active.deals} deals</span></div><div className="bl-bars">{revenueData.map((d, i) => <button className={i === activeMonth ? "active" : ""} onMouseEnter={() => setActiveMonth(i)} onFocus={() => setActiveMonth(i)} onClick={() => setActiveMonth(i)} key={d.month}><i style={{ height: `${(d.revenue / max) * 100}%` }} /><span>{d.month}</span></button>)}</div><div className="bl-axis"><span>$0</span><span>$4k</span><span>$8k</span></div></div>;
}

function DeliverableTimeline() {
  return <div className="bl-calendar"><div className="bl-days">{["Mon","Tue","Wed","Thu","Fri"].map((d) => <b key={d}>{d}</b>)}</div>{["Script draft", "Brand review", "Shoot day", "Reel publish", "Usage report"].map((item, i) => <button className={`bl-cal-item s${i}`} key={item}><strong>{item}</strong><span>{["Writing", "Waiting", "Production", "Scheduled", "Proof sent"][i]}</span></button>)}</div>;
}

function ContractAnalyzer() {
  return <div className="bl-contract-view"><article><span>CONTRACT_PREVIEW.pdf</span><h3>Campaign Services Agreement</h3><p>Creator grants brand paid usage rights for thirty days after final asset delivery...</p><p>Payment issued Net 30 after all content is published and links are submitted.</p></article><aside><b>Extracted deal info</b><span>Deliverables: 3 Reels, 6 Stories</span><span>Payment: Net 30</span><span>Usage: 30 days paid social</span><em>Risk: payment after publishing</em></aside></div>;
}

function MediaKitPreview() {
  return (
    <div className="bl-media-preview">
      <div className="bl-media-paper">
        <header className="bl-media-head">
          <div className="bl-profile-mark">
            <span>CN</span>
          </div>
          <div>
            <span>@creatorname</span>
            <h3>Creator Name</h3>
            <p>Beauty and lifestyle creator for skincare launches, UGC systems, and clean product storytelling.</p>
          </div>
          <a href="/register">Work with me</a>
        </header>

        <div className="bl-media-summary">
          <span><b>Beauty</b>Niche</span>
          <span><b>148k</b>Audience</span>
          <span><b>6.8%</b>Engagement</span>
        </div>

        <section className="bl-selected-work" aria-label="Selected media kit work">
          <div>
            <i><em>01</em></i>
            <span><b>Skincare launch</b><small>3 reels · product story</small></span>
          </div>
          <div>
            <i><em>02</em></i>
            <span><b>Morning routine</b><small>Reel · 6.8% engagement</small></span>
          </div>
          <div>
            <i><em>03</em></i>
            <span><b>UGC product demo</b><small>Usage-ready asset</small></span>
          </div>
        </section>

        <div className="bl-media-bottom">
          <section>
            <small>Services</small>
            <p><b>Reel package</b><span>from $1.2k</span></p>
            <p><b>UGC bundle</b><span>from $850</span></p>
          </section>
          <section>
            <small>Featured brands</small>
            <div className="bl-brand-tags">
              <span>Nova</span>
              <span>Glow Co</span>
              <span>AeroFit</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function InboundFlow() {
  return <div className="bl-inbound-flow">{["Brand interest", "Inquiry", "Deal", "Payment"].map((step, index) => <div key={step}><span>{step}</span>{index < 3 && <i />}</div>)}</div>;
}

function RelationshipLedger() {
  return <div className="bl-ledger"><header><b>Hearth Studio</b><span>4 collaborations · $12,600 lifetime</span></header>{["Spring launch completed", "Holiday brief discussed", "Net 15 terms negotiated"].map((event, index) => <p key={event}><span>{["Apr", "Jul", "Sep"][index]}</span>{event}</p>)}</div>;
}

function FinalMiniUi() {
  return <div className="bl-final-ui"><span>Today</span><b>2 payments ready to follow up</b><i /><p>Contract signed · Deliverables scheduled · Portfolio updated</p></div>;
}

