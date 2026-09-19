import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  fetchContracts,
  fetchDeals,
  fetchDeliverables,
  fetchInboundInquiries,
  fetchIntelligence,
  fetchMoneyCockpit
} from "../lib/api";

import AddDealModal from "../components/AddDealModal";
import { formatMoney, totalEarned } from "../utils/deals";

const monthKey = (value) => {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function Dashboard() {
  const { user } = useAuth();

  const [deals, setDeals] = useState([]);
  const [money, setMoney] = useState(null);
  const [deliverables, setDeliverables] = useState([]);
  const [deliverableStats, setDeliverableStats] = useState({});
  const [inboundStats, setInboundStats] = useState({});
  const [contracts, setContracts] = useState([]);
  const [intelligence, setIntelligence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [dealData, moneyData, delData, inboundData, contractData, intelData] =
          await Promise.all([
            fetchDeals().catch(() => ({ deals: [] })),
            fetchMoneyCockpit().catch(() => null),
            fetchDeliverables().catch(() => ({ deliverables: [], stats: {} })),
            fetchInboundInquiries().catch(() => ({ inquiries: [], stats: {} })),
            fetchContracts().catch(() => ({ contracts: [], stats: {} })),
            fetchIntelligence().catch(() => null)
          ]);

        if (!alive) return;
        setDeals(dealData.deals || []);
        setMoney(moneyData);
        setDeliverables(delData.deliverables || []);
        setDeliverableStats(delData.stats || {});
        setInboundStats(inboundData.stats || {});
        setContracts(contractData.contracts || []);
        setIntelligence(intelData);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const totalDeals = deals.length;
  const activeDeals = deals.filter((deal) => ["pending", "active", "overdue"].includes(deal.status));
  const overduePayments = money?.summary?.overdue || 0;
  const pendingPayments = money?.summary?.pending || 0;
  const revenueMonth = money?.summary?.earned_this_month || 0;

  const revenueTrend = useMemo(() => {
    const map = new Map();
    for (const deal of deals) {
      if (deal.status !== "completed") continue;
      const key = monthKey(deal.paid_date || deal.created_at);
      if (!key) continue;
      map.set(key, (map.get(key) || 0) + totalEarned(deal));
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, revenue]) => ({
        key,
        label: new Date(`${key}-01`).toLocaleDateString(undefined, { month: "short" }),
        revenue
      }));
  }, [deals]);

  const currentMonth = monthKey(new Date());
  const previousMonthDate = new Date();
  previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
  const previousMonth = monthKey(previousMonthDate);
  const currentMonthRevenue = revenueTrend.find((item) => item.key === currentMonth)?.revenue || revenueMonth;
  const previousMonthRevenue = revenueTrend.find((item) => item.key === previousMonth)?.revenue || 0;
  const ytd = deals
    .filter((deal) => deal.status === "completed" && new Date(deal.created_at).getFullYear() === new Date().getFullYear())
    .reduce((sum, deal) => sum + totalEarned(deal), 0);

  const attention = useMemo(
    () => buildAttention({ deals, deliverables, contracts }),
    [deals, deliverables, contracts]
  );

  const insights = useMemo(() => buildInsights({ intelligence, deals, money }), [intelligence, deals, money]);
  const pipeline = useMemo(() => buildPipeline(deals), [deals]);
  const paymentStatus = useMemo(() => buildPaymentStatus({ deals, money }), [deals, money]);
  const upcomingWork = useMemo(() => buildUpcomingWork(deliverables), [deliverables]);
  const brandPerformance = useMemo(() => buildBrandPerformance(deals), [deals]);

  const handleDealCreated = (newDeal) => {
    setDeals((prev) => [newDeal, ...prev]);
    setShowAddModal(false);
  };

  return (
    <div className="dash-page">
      <header className="dash-hero">
        <div>
          <span className="dash-eyebrow">Creator business dashboard</span>
          <h1>Good morning, {user?.username || "creator"}.</h1>
          <p>Revenue, follow-ups, deliverables and deal momentum in one command center.</p>
        </div>
        <div className="dash-hero-actions">
          <button
            disabled={user.plan === "free" && totalDeals >= 3}
            onClick={() => setShowAddModal(true)}
          >
            Add Deal
          </button>
          <Link to="/money">Money Cockpit</Link>
        </div>
      </header>

      {user.plan === "free" && (
        <div className="upgrade-banner dash-upgrade">
          <div>
            <h5 className="mb-1">Free plan</h5>
            <p className="mb-0 text-muted">
              {totalDeals >= 3 ? "You've used all 3 free deals. Upgrade to continue adding deals." : `You've used ${totalDeals} of 3 free deals.`}
            </p>
          </div>
          {totalDeals >= 3 && <Link to="/pricing">View plans</Link>}
        </div>
      )}

      {loading ? (
        <div className="dash-empty">Loading your business dashboard...</div>
      ) : (
        <>
          <section className="dash-kpis">
            <Kpi title="Revenue this month" value={formatMoney(revenueMonth)} note="Recorded completed revenue" />
            <Kpi title="Pending payments" value={formatMoney(pendingPayments)} note="Open deal value" />
            <Kpi title="Overdue payments" value={formatMoney(overduePayments)} tone="danger" note="Needs follow-up" />
            <Kpi title="Active deals" value={String(activeDeals.length)} note={`${totalDeals} total deals`} />
          </section>

          <section className="dash-secondary">
            <SecondaryCard to="/deliverables" label="Upcoming deliverables" value={deliverableStats.due_this_week || 0} note="Due this week" />
            <SecondaryCard to="/money" label="Upcoming payment dates" value={countUpcomingPayments(deals)} note="Open dated payments" />
            <SecondaryCard to="/inbound" label="New inbound inquiries" value={inboundStats.new || 0} note="Fresh collaboration leads" />
            <SecondaryCard to="/contracts" label="Contracts awaiting signature" value={contracts.filter((c) => c.expiry_state === "awaiting_signature").length} note="Paperwork to review" />
          </section>

          <main className="dash-main-grid">
            <section className="dash-panel dash-revenue">
              <PanelHead title="Revenue performance" action="6 months" />
              <div className="dash-revenue-summary">
                <MiniStat label="Current month" value={formatMoney(currentMonthRevenue)} />
                <MiniStat label="Previous month" value={formatMoney(previousMonthRevenue)} />
                <MiniStat label="Year to date" value={formatMoney(ytd)} />
              </div>
              <RevenueChart data={revenueTrend} />
            </section>

            <section className="dash-panel dash-pipeline">
              <PanelHead title="Deal pipeline" action={`${totalDeals} total`} />
              <PipelineChart data={pipeline} total={Math.max(1, totalDeals)} />
            </section>

            <section className="dash-panel dash-payments">
              <PanelHead title="Payment status" action="Recorded value" />
              <PaymentStatus data={paymentStatus} />
            </section>

            <section className="dash-panel dash-attention">
              <PanelHead title="Needs attention" action={`${attention.length} item${attention.length === 1 ? "" : "s"}`} />
              {attention.length ? attention.map((item) => (
                <Link className={`dash-attention-item ${item.tone}`} to={item.to} key={`${item.label}-${item.detail}`}>
                  <span>{item.label}</span>
                  <strong>{item.detail}</strong>
                </Link>
              )) : <div className="dash-empty-inline">Nothing urgent right now.</div>}
            </section>

            <section className="dash-panel dash-active">
              <PanelHead title="Active deals" action={<Link to="/deals">Open CRM</Link>} />
              {activeDeals.length ? activeDeals.slice(0, 6).map((deal) => (
                <Link className="dash-deal-row" to={`/deals/${deal.id}`} key={deal.id}>
                  <div>
                    <strong>{deal.brand_name}</strong>
                    <span>{deal.product_name || deal.platform || "Campaign"}</span>
                  </div>
                  <em>{formatMoney(totalEarned(deal), deal.currency)}</em>
                  <span className={`dash-pill ${deal.status}`}>{deal.status}</span>
                  <small>{nextAction(deal)}</small>
                  <small>{deadlineFor(deal)}</small>
                </Link>
              )) : <div className="dash-empty-inline">No active deals yet. <Link to="/deals">Open deals workspace</Link></div>}
            </section>

            <section className="dash-panel dash-work">
              <PanelHead title="Upcoming work" action={<Link to="/deliverables">View timeline</Link>} />
              {upcomingWork.length ? upcomingWork.map((item) => (
                <Link className="dash-work-row" to={`/deals/${item.deal_id}`} key={item.id}>
                  <time>{dateChip(item.due_date)}</time>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.brand_name} · {statusLabel(item.status)}</span>
                  </div>
                  <em>{deadlineFor({ posting_date: item.due_date })}</em>
                </Link>
              )) : <div className="dash-empty-inline">No dated deliverables coming up.</div>}
            </section>

            <section className="dash-panel dash-brands">
              <PanelHead title="Brand performance" action="Recorded revenue" />
              <BrandBars data={brandPerformance} />
            </section>

            <section className="dash-panel dash-intel">
              <PanelHead title="Brandio Intelligence" action="Data-driven" />
              {insights.map((insight) => (
                <div className="dash-insight" key={insight}>{insight}</div>
              ))}
            </section>

            <section className="dash-panel dash-actions">
              <PanelHead title="Quick actions" action="Move work forward" />
              <div className="dash-action-grid">
                <button onClick={() => setShowAddModal(true)}>Add Deal</button>
                <Link to="/brands">Add Brand</Link>
                <Link to="/deliverables">Add Deliverable</Link>
                <Link to="/money">Create Invoice</Link>
                <Link to="/inbound">Add Follow-up</Link>
              </div>
            </section>
          </main>

        </>
      )}

      {showAddModal && (
        <AddDealModal
          onClose={() => setShowAddModal(false)}
          onCreated={handleDealCreated}
          totalDeals={totalDeals}
          plan={user.plan}
        />
      )}
    </div>
  );
}

function RevenueChart({ data }) {
  if (!data.length) {
    return (
      <div className="dash-chart-empty">
        <strong>No recorded revenue yet.</strong>
        <span>Complete a deal with revenue to start building a trend.</span>
      </div>
    );
  }

  const width = 640;
  const height = 250;
  const pad = { top: 20, right: 18, bottom: 38, left: 58 };
  const max = Math.max(1, ...data.map((item) => item.revenue));
  const points = data.map((item, index) => {
    const x = data.length === 1
      ? (width - pad.left - pad.right) / 2 + pad.left
      : pad.left + (index / (data.length - 1)) * (width - pad.left - pad.right);
    const y = pad.top + (1 - item.revenue / max) * (height - pad.top - pad.bottom);
    return { ...item, x, y };
  });
  const line = points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
  const area = `${line} L ${points.at(-1).x} ${height - pad.bottom} L ${points[0].x} ${height - pad.bottom} Z`;
  const ticks = [0, 0.5, 1].map((ratio) => ({
    y: pad.top + (1 - ratio) * (height - pad.top - pad.bottom),
    value: max * ratio
  }));

  return (
    <div className="dash-analytics-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Revenue over time">
        <defs>
          <linearGradient id="dashRevenueFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#6d4aff" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#365cff" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {ticks.map((tick) => (
          <g key={tick.y}>
            <line className="dash-gridline" x1={pad.left} x2={width - pad.right} y1={tick.y} y2={tick.y} />
            <text className="dash-axis" x={pad.left - 10} y={tick.y + 4} textAnchor="end">{formatCompact(tick.value)}</text>
          </g>
        ))}
        <path className="dash-area" d={area} />
        <path className="dash-line" d={line} />
        {points.map((point) => (
          <g className="dash-point" key={point.key}>
            <circle cx={point.x} cy={point.y} r="5" />
            <title>{point.label}: {formatMoney(point.revenue)}</title>
          </g>
        ))}
        {points.map((point) => (
          <text className="dash-axis" x={point.x} y={height - 12} textAnchor="middle" key={`${point.key}-label`}>{point.label}</text>
        ))}
      </svg>
      {data.length === 1 && <p>Only one completed revenue point is available, so Brandio is showing it without inventing a trend.</p>}
    </div>
  );
}

function PipelineChart({ data, total }) {
  return (
    <div className="dash-pipeline-chart">
      <div className="dash-pipeline-track">
        {data.map((item) => (
          <span
            className={item.key}
            style={{ width: `${Math.max(item.count ? 8 : 0, (item.count / total) * 100)}%` }}
            title={`${item.label}: ${item.count}`}
            key={item.key}
          />
        ))}
      </div>
      <div className="dash-pipeline-legend">
        {data.map((item) => (
          <div key={item.key}>
            <i className={item.key} />
            <strong>{item.count}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentStatus({ data }) {
  const total = Math.max(1, data.reduce((sum, item) => sum + item.value, 0));
  return (
    <div className="dash-payment-status">
      {data.map((item) => (
        <div className={item.key} key={item.key}>
          <span>{item.label}</span>
          <strong>{formatMoney(item.value)}</strong>
          <i><b style={{ width: `${(item.value / total) * 100}%` }} /></i>
        </div>
      ))}
    </div>
  );
}

function BrandBars({ data }) {
  if (!data.length) return <div className="dash-empty-inline">Complete deals to compare brand revenue.</div>;
  const max = Math.max(1, ...data.map((item) => item.revenue));
  return (
    <div className="dash-brand-bars">
      {data.map((item) => (
        <div key={item.brand}>
          <span>{item.brand}</span>
          <i><b style={{ width: `${Math.max(3, (item.revenue / max) * 100)}%` }} /></i>
          <strong>{formatMoney(item.revenue)}</strong>
        </div>
      ))}
    </div>
  );
}

function Kpi({ title, value, note, tone }) {
  return (
    <article className={`dash-kpi ${tone || ""}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function SecondaryCard({ to, label, value, note }) {
  return (
    <Link className="dash-secondary-card" to={to}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </Link>
  );
}

function PanelHead({ title, action }) {
  return (
    <div className="dash-panel-head">
      <h2>{title}</h2>
      <span>{action}</span>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function buildAttention({ deals, deliverables, contracts }) {
  const items = [];
  for (const deal of deals) {
    if (deal.status === "overdue" || (deal.payment_due_date && new Date(deal.payment_due_date) < new Date() && deal.status !== "completed")) {
      items.push({ label: "Payment overdue", detail: deal.brand_name, tone: "danger", to: `/deals/${deal.id}` });
    }
  }
  for (const item of deliverables) {
    const days = daysUntil(item.due_date);
    if (days === 1) items.push({ label: "Deliverable due tomorrow", detail: `${item.brand_name}: ${item.title}`, tone: "warn", to: `/deals/${item.deal_id}` });
    if (days < 0 && !["approved", "published", "completed"].includes(item.status)) items.push({ label: "Deliverable overdue", detail: `${item.brand_name}: ${item.title}`, tone: "danger", to: `/deals/${item.deal_id}` });
    if (["submitted", "changes_requested"].includes(item.status)) items.push({ label: "Brand approval pending", detail: `${item.brand_name}: ${item.title}`, tone: "info", to: `/deals/${item.deal_id}` });
  }
  for (const contract of contracts) {
    if (contract.expiry_state === "awaiting_signature") {
      items.push({ label: "Contract awaiting signature", detail: contract.brand_name, tone: "info", to: "/contracts" });
    }
  }
  return items.slice(0, 8);
}

function buildPipeline(deals) {
  const stages = [
    { key: "pending", label: "Pending", count: 0 },
    { key: "active", label: "Active", count: 0 },
    { key: "completed", label: "Completed", count: 0 },
    { key: "overdue", label: "Overdue", count: 0 }
  ];
  for (const deal of deals) {
    const stage = stages.find((item) => item.key === deal.status);
    if (stage) stage.count += 1;
  }
  return stages;
}

function buildPaymentStatus({ deals, money }) {
  const paid = deals
    .filter((deal) => deal.status === "completed")
    .reduce((sum, deal) => sum + totalEarned(deal), 0);
  return [
    { key: "paid", label: "Paid", value: paid },
    { key: "pending", label: "Pending", value: money?.summary?.pending || 0 },
    { key: "overdue", label: "Overdue", value: money?.summary?.overdue || 0 }
  ];
}

function buildUpcomingWork(deliverables) {
  return [...deliverables]
    .filter((item) => item.due_date && daysUntil(item.due_date) >= -1 && !["approved", "published", "completed"].includes(item.status))
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 6);
}

function buildBrandPerformance(deals) {
  const map = new Map();
  for (const deal of deals) {
    if (deal.status !== "completed") continue;
    map.set(deal.brand_name, (map.get(deal.brand_name) || 0) + totalEarned(deal));
  }
  return [...map.entries()]
    .map(([brand, revenue]) => ({ brand, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);
}

function buildInsights({ intelligence, deals, money }) {
  const insights = [];
  const totals = intelligence?.totals || {};
  if (totals.repeatBrands) insights.push(`${totals.repeatBrands} repeat brand relationship${totals.repeatBrands === 1 ? "" : "s"} in your recorded history.`);
  if (totals.avgPaymentDays != null) insights.push(`Average recorded payment window is ${totals.avgPaymentDays} days.`);
  if (money?.summary?.expected > 0) insights.push(`${formatMoney(money.summary.expected)} expected across open deals.`);
  if (deals.length && !insights.length) insights.push("Add completed deals, payment dates and deliverables to unlock richer observations.");
  if (!deals.length) insights.push("Your dashboard will become more useful after your first deal is recorded.");
  return insights.slice(0, 4);
}

function countUpcomingPayments(deals) {
  return deals.filter((deal) => deal.status !== "completed" && deal.payment_due_date && daysUntil(deal.payment_due_date) >= 0 && daysUntil(deal.payment_due_date) <= 30).length;
}

function nextAction(deal) {
  if (deal.status === "overdue") return "Follow up on payment";
  if (deal.status === "pending") return "Confirm scope";
  if (deal.status === "active") return "Track deliverables";
  return "Review";
}

function deadlineFor(deal) {
  const date = deal.posting_date || deal.payment_due_date;
  if (!date) return "No deadline";
  const days = daysUntil(date);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  return `${days}d left`;
}

function daysUntil(date) {
  if (!date) return 9999;
  return Math.ceil((new Date(date) - new Date()) / 86400000);
}

function statusLabel(status) {
  return String(status || "pending").replaceAll("_", " ");
}

function dateChip(value) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatCompact(value) {
  if (value >= 1000000) return `${Math.round(value / 100000) / 10}m`;
  if (value >= 1000) return `${Math.round(value / 100) / 10}k`;
  return String(Math.round(value));
}
