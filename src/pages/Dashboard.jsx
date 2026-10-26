import RevenueChart from "../components/RevenueChart";
import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchContracts, fetchDeals, fetchDeliverables, fetchInboundInquiries, fetchIntelligence, fetchMoneyCockpit } from "../lib/api";
import AddDealModal from "../components/AddDealModal";
import { formatMoney, normalizeCurrency, totalEarned } from "../utils/deals";
import { freeDealCreditsUsed } from "../utils/pricing";

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
  const [loadWarning, setLoadWarning] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [period, setPeriod] = useState(6);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.allSettled([fetchDeals(), fetchMoneyCockpit(selectedCurrency), fetchDeliverables(), fetchInboundInquiries(), fetchContracts(), fetchIntelligence(selectedCurrency)])
      .then((results) => {
        if (!alive) return;
        const [dealData, moneyData, delData, inboundData, contractData, intelData] = results.map((result) => result.status === "fulfilled" ? result.value : null);
        setDeals(dealData?.deals || []);
        setMoney(moneyData);
        setDeliverables(delData?.deliverables || []);
        setDeliverableStats(delData?.stats || {});
        setInboundStats(inboundData?.stats || {});
        setContracts(contractData?.contracts || []);
        setIntelligence(intelData);
        setLoadWarning(results.some((result) => result.status === "rejected"));
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [refreshKey, selectedCurrency]);

  const currency = money?.currency || selectedCurrency || normalizeCurrency(deals[0]?.currency);
  const availableCurrencies = money?.availableCurrencies || [...new Set(deals.map((deal) => normalizeCurrency(deal.currency)))];
  const currencyDeals = deals.filter((deal) => normalizeCurrency(deal.currency) === currency);
  const activeDeals = deals.filter((deal) => ["pending", "active", "overdue"].includes(deal.status));
  const revenueTrend = useMemo(() => buildRevenueTrend(currencyDeals, period), [currencyDeals, period]);
  const attention = useMemo(() => buildAttention({ deals, deliverables, contracts }), [deals, deliverables, contracts]);
  const insights = useMemo(() => buildInsights({ intelligence, deals, money, currency }), [intelligence, deals, money, currency]);
  const pipeline = useMemo(() => buildPipeline(deals), [deals]);
  const payments = useMemo(() => buildPaymentStatus({ deals: currencyDeals, money }), [currencyDeals, money]);
  const upcomingWork = useMemo(() => buildUpcomingWork(deliverables), [deliverables]);
  const brandPerformance = useMemo(() => buildBrandPerformance(currencyDeals), [currencyDeals]);
  const currentMonth = monthKey(new Date());
  const now = new Date();
  const previousMonth = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const revenueMonth = Number(money?.summary?.earned_this_month ?? revenueTrend.find((item) => item.key === currentMonth)?.revenue ?? 0);
  const previousMonthRevenue = revenueTrend.find((item) => item.key === previousMonth)?.revenue || 0;
  const ytd = currencyDeals.filter((deal) => deal.status === "completed" && parseDate(deal.paid_date || deal.created_at).getFullYear() === now.getFullYear()).reduce((sum, deal) => sum + totalEarned(deal), 0);
  const pendingPayments = Number(money?.summary?.pending || 0);
  const overduePayments = Number(money?.summary?.overdue || 0);
  const awaitingSignature = contracts.filter((contract) => contract.expiry_state === "awaiting_signature").length;

  const handleDealCreated = (newDeal) => {
    setDeals((previous) => [newDeal, ...previous]);
    setShowAddModal(false);
    setSelectedCurrency(normalizeCurrency(newDeal.currency));
    setRefreshKey((value) => value + 1);
  };

  return <div className="overview-page">
    <Helmet><title>Overview - Brandio</title></Helmet>
    <div className="ov-container">
      <header className="ov-header">
        <div><span className="ov-date">{now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</span><h1>{timeGreeting()}, {user?.username || "creator"}<span className="ov-greeting-dot">.</span></h1><p>A clear view of your business, and what comes next.</p></div>
        <div className="ov-header-actions">{availableCurrencies.length > 1 && <label>Currency <select aria-label="Overview currency" value={currency} onChange={(event) => setSelectedCurrency(event.target.value)}>{availableCurrencies.map((code) => <option key={code} value={code}>{code}</option>)}</select></label>}<Link to="/money" className="ov-button ov-button-secondary">View finances <Icon name="arrow" /></Link><button className="ov-button ov-button-primary" disabled={loading} onClick={() => setShowAddModal(true)}><Icon name="plus" /> Add deal</button></div>
      </header>

      {loading ? <div className="ov-loading" role="status"><span className="ov-loading-dot" />Loading your overview…</div> : <>
        {loadWarning && <div className="ov-warning" role="status">Some dashboard data couldn’t be loaded. Figures may be incomplete.<button onClick={() => setRefreshKey((value) => value + 1)}>Retry</button></div>}
        <section className="ov-metrics" aria-label="Business summary">
          <Kpi title="Revenue this month" value={formatMoney(revenueMonth, currency)} note="From completed deals" icon="revenue" to="/money" tone="purple" />
          <Kpi title="Pending payments" value={formatMoney(pendingPayments, currency)} note={`${countUpcomingPayments(currencyDeals)} payment dates in the next 30 days`} icon="clock" to="/money" tone="amber" />
          <Kpi title="Overdue payments" value={formatMoney(overduePayments, currency)} note={overduePayments > 0 ? "Ready for a follow-up" : "No overdue balance recorded"} icon="alert" to="/money" tone={overduePayments > 0 ? "red" : "green"} />
          <Kpi title="Active deals" value={String(activeDeals.length)} note={`${deals.length} deals in your workspace`} icon="deals" to="/deals" tone="blue" />
        </section>

        <div className="ov-grid">
          <section className="ov-panel ov-revenue" aria-labelledby="ov-revenue-title">
            <PanelHead title="Revenue overview" id="ov-revenue-title" subtitle="Completed deal revenue, month by month" action={<div className="ov-period" role="group" aria-label="Revenue period">{[3, 6, 12].map((months) => <button key={months} aria-label={`Last ${months} months`} aria-pressed={period === months} onClick={() => setPeriod(months)}>{months}M</button>)}</div>} />
            <div className="ov-revenue-summary"><MiniStat label="This month" value={formatMoney(revenueMonth, currency)} /><MiniStat label="Last month" value={formatMoney(previousMonthRevenue, currency)} /><MiniStat label="Year to date" value={formatMoney(ytd, currency)} /></div>
            <RevenueChart data={revenueTrend} currency={currency} />
          </section>

          <section className="ov-panel ov-attention" aria-labelledby="ov-attention-title">
            <PanelHead title="Needs your attention" id="ov-attention-title" action={<span className={`ov-count ${attention.length ? "is-urgent" : ""}`}>{attention.length}</span>} />
            <div className="ov-attention-list">{attention.length ? attention.slice(0, 4).map((item, index) => <Link className={`ov-attention-item ${item.tone}`} to={item.to} key={`${item.label}-${index}`}><span className="ov-attention-icon"><Icon name={item.tone === "danger" ? "alert" : "clock"} /></span><div><span>{item.label}</span><strong>{item.detail}</strong></div><Icon name="chevron" /></Link>) : <div className="ov-all-clear"><span><Icon name="check" /></span><strong>You’re all caught up.</strong><p>No urgent items in your recorded work.</p></div>}</div>
            {attention.length > 4 && <p className="ov-more-attention">{attention.length - 4} more items to review in your workspace.</p>}
            <div className="ov-radar"><span className="ov-eyebrow">ON YOUR RADAR</span><Link to="/inbound"><span>New inquiries</span><strong>{inboundStats.new || 0}</strong><Icon name="chevron" /></Link><Link to="/deliverables"><span>Due this week</span><strong>{deliverableStats.due_this_week || 0}</strong><Icon name="chevron" /></Link><Link to="/contracts"><span>Awaiting signature</span><strong>{awaitingSignature}</strong><Icon name="chevron" /></Link></div>
          </section>

          <section className="ov-panel ov-active" aria-labelledby="ov-active-title">
            <PanelHead title="Active deals" id="ov-active-title" subtitle={`${activeDeals.length} open collaboration${activeDeals.length === 1 ? "" : "s"}`} action={<PanelLink to="/deals">View all deals</PanelLink>} />
            {activeDeals.length ? <div className="ov-deal-table"><div className="ov-deal-labels" aria-hidden="true"><span>Brand / campaign</span><span>Value</span><span>Status / next step</span><span>Due</span></div>{activeDeals.slice(0, 5).map((deal) => <Link className="ov-deal-row" to={`/deals/${deal.id}`} key={deal.id}><div className="ov-deal-brand"><span className="ov-brand-avatar" aria-hidden="true">{(deal.brand_name || "?").slice(0, 2).toUpperCase()}</span><div><strong>{deal.brand_name || "Untitled brand"}</strong><span>{deal.product_name || deal.platform || "Campaign"}</span></div></div><span className="ov-deal-value">{formatMoney(totalEarned(deal), deal.currency)}</span><div className="ov-deal-status"><span className={`ov-status ${deal.status}`}><i />{statusLabel(deal.status)}</span><small>{nextAction(deal)}</small></div><span className="ov-deal-deadline">{deadlineFor(deal)}</span></Link>)}</div> : <EmptyState icon="deals" title="Room for your next collaboration." note="Add a deal to start tracking your brand work." />}
          </section>

          <section className="ov-panel ov-payments" aria-labelledby="ov-payments-title"><PanelHead title="Payment snapshot" id="ov-payments-title" action={<PanelLink to="/money">Details</PanelLink>} /><PaymentStatus data={payments} currency={currency} /></section>

          <section className="ov-panel ov-work" aria-labelledby="ov-work-title"><PanelHead title="Coming up next" id="ov-work-title" subtitle="Your next dated deliverables" action={<PanelLink to="/deliverables">View timeline</PanelLink>} />{upcomingWork.length ? <div className="ov-agenda">{upcomingWork.slice(0, 4).map((item) => <Link className="ov-agenda-item" to={`/deals/${item.deal_id}`} key={item.id}><time dateTime={item.due_date}><span>{parseDate(item.due_date).toLocaleDateString(undefined, { month: "short" })}</span><strong>{parseDate(item.due_date).getDate()}</strong></time><div><strong>{item.title || "Deliverable"}</strong><span>{item.brand_name || "Untitled brand"} · {statusLabel(item.status)}</span></div><span className="ov-agenda-due">{deadlineFor({ posting_date: item.due_date })}</span></Link>)}</div> : <EmptyState icon="calendar" title="Your schedule has some space." note="Dated deliverables will appear here as you plan your work." />}</section>

          <section className="ov-panel ov-pipeline" aria-labelledby="ov-pipeline-title"><PanelHead title="Deal pipeline" id="ov-pipeline-title" action={<span className="ov-muted">{deals.length} total</span>} /><PipelineChart data={pipeline} /></section>

          <section className="ov-panel ov-brands" aria-labelledby="ov-brands-title"><PanelHead title="Top brand relationships" id="ov-brands-title" subtitle="Ranked by recorded completed revenue" action={<PanelLink to="/brands">All brands</PanelLink>} /><BrandBars data={brandPerformance} currency={currency} /></section>

          <section className="ov-panel ov-insights" aria-labelledby="ov-insights-title"><PanelHead title="Business notes" id="ov-insights-title" action={<span className="ov-insight-label"><Icon name="spark" />Intelligence</span>} /><div className="ov-insight-list">{insights.map((insight) => <p key={insight}><span aria-hidden="true" /><span>{insight}</span></p>)}</div><PanelLink to="/intelligence">Explore intelligence</PanelLink></section>
        </div>

        <section className="ov-shortcuts" aria-label="Workspace shortcuts"><div><span className="ov-eyebrow">KEEP THINGS MOVING</span><h2>Your workspace, one click away.</h2></div><div className="ov-shortcut-links">{[["/brands", "Manage brands", "brands"], ["/deliverables", "Deliverables", "calendar"], ["/money", "Invoices & money", "revenue"], ["/inbound", "Follow-ups", "inbox"]].map(([to, label, icon]) => <Link to={to} key={to}><Icon name={icon} /><span>{label}</span><Icon name="arrow" /></Link>)}</div></section>
      </>}
    </div>
    {showAddModal && <AddDealModal onClose={() => setShowAddModal(false)} onCreated={handleDealCreated} totalDeals={freeDealCreditsUsed(user, deals.length)} />}
  </div>;
}

function Kpi({ title, value, note, icon, to, tone }) {
  return <Link to={to} className={`ov-metric ov-tone-${tone}`}><div className="ov-metric-top"><span>{title}</span><span className="ov-metric-icon"><Icon name={icon} /></span></div><strong>{value}</strong><span className="ov-metric-note">{note}<Icon name="arrow" /></span></Link>;
}
function PanelHead({ title, subtitle, action, id }) { return <header className="ov-panel-heading"><div><h2 id={id}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</header>; }
function PanelLink({ to, children }) { return <Link to={to} className="ov-panel-link">{children}<Icon name="arrow" /></Link>; }
function MiniStat({ label, value }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
function EmptyState({ icon, title, note }) { return <div className="ov-empty"><span className="ov-empty-icon"><Icon name={icon} /></span><strong>{title}</strong><p>{note}</p></div>; }


function PaymentStatus({ data, currency }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const paid = data.find((item) => item.key === "paid")?.value || 0;
  const percent = total > 0 ? Math.round(paid / total * 100) : 0;
  const circumference = 2 * Math.PI * 34;
  return <div className="ov-payment-content"><div className="ov-collected"><div><span>Total collected</span><strong>{formatMoney(paid, currency)}</strong><small>{formatMoney(total - paid, currency)} still open</small></div><div className="ov-payment-ring"><svg viewBox="0 0 84 84" aria-hidden="true"><circle cx="42" cy="42" r="34" className="ov-ring-track" /><circle cx="42" cy="42" r="34" className="ov-ring-fill" strokeDasharray={`${(percent / 100) * circumference} ${circumference}`} /></svg><span>{total > 0 ? `${percent}%` : "—"}</span></div></div><div className="ov-payment-legend">{data.map((item) => <div key={item.key}><span><i className={item.key} />{item.label}</span><strong>{formatMoney(item.value, currency)}</strong></div>)}</div><p>Based on your recorded deal values.</p></div>;
}

function PipelineChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  return <div className="ov-pipeline-content"><div className="ov-pipeline-total"><strong>{total}</strong><span>deals in your pipeline</span></div><div className="ov-pipeline-track" role="img" aria-label={data.map((item) => `${item.label}: ${item.count}`).join(", ")}>{data.filter((item) => item.count > 0).map((item) => <span className={item.key} style={{ flexGrow: item.count }} key={item.key} title={`${item.label}: ${item.count}`} />)}</div><div className="ov-pipeline-legend">{data.map((item) => <div key={item.key}><span><i className={item.key} />{item.label}</span><strong>{item.count}</strong></div>)}</div></div>;
}

function BrandBars({ data, currency }) {
  if (!data.length) return <EmptyState icon="brands" title="Good relationships start here." note="Your completed brand collaborations will appear here." />;
  const max = Math.max(1, ...data.map((item) => item.revenue));
  return <div className="ov-brand-bars">{data.slice(0, 4).map((item, index) => <div key={item.brand}><span className="ov-brand-rank">0{index + 1}</span><div><div><span>{item.brand || "Untitled brand"}</span><strong>{formatMoney(item.revenue, currency)}</strong></div><i><b style={{ width: `${Math.max(0, item.revenue / max * 100)}%` }} /></i></div></div>)}</div>;
}

function Icon({ name }) {
  const paths = {
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <path d="M6 18 18 6M6 6h12v12" />,
    chevron: <path d="m9 5 7 7-7 7" />,
    check: <path d="m5 12 4 4L19 6" />,
    revenue: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 10h18m-6 5h3" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    alert: <><path d="m10.3 4.3-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-2.7l-8-14a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 4v.1" /></>,
    deals: <><rect x="3" y="7" width="18" height="14" rx="3" /><path d="M8 7V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3M3 12a22 22 0 0 0 18 0m-9-1v3" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2" /></>,
    brands: <><path d="M12 3 3 8l9 5 9-5-9-5Zm-9 9 9 5 9-5m-18 5 9 5 9-5" /></>,
    inbox: <><path d="m3 4-1 14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2L21 4H3Z" /><path d="M2 14h6l2 3h4l2-3h6" /></>,
    spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" /></>
  };
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.arrow}</svg>;
}

function parseDate(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) { const [year, month, day] = value.split("-").map(Number); return new Date(year, month - 1, day); }
  return new Date(value);
}
function monthKey(value) { const date = parseDate(value); return Number.isNaN(date.getTime()) ? "" : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; }
function buildRevenueTrend(deals, period) {
  const totals = new Map();
  for (const deal of deals) { if (deal.status !== "completed") continue; const key = monthKey(deal.paid_date || deal.created_at); if (key) totals.set(key, (totals.get(key) || 0) + totalEarned(deal)); }
  const now = new Date();
  return Array.from({ length: period }, (_, index) => { const date = new Date(now.getFullYear(), now.getMonth() - period + 1 + index, 1); const key = monthKey(date); return { key, label: date.toLocaleDateString(undefined, { month: "short" }), fullLabel: date.toLocaleDateString(undefined, { month: "long", year: "numeric" }), revenue: totals.get(key) || 0 }; });
}
function buildAttention({ deals, deliverables, contracts }) {
  const items = [];
  for (const deal of deals) { if (deal.status === "overdue" || (deal.payment_due_date && daysUntil(deal.payment_due_date) < 0 && deal.status !== "completed")) items.push({ label: "Payment overdue", detail: deal.brand_name || "Untitled brand", tone: "danger", to: `/deals/${deal.id}` }); }
  for (const item of deliverables) {
    if (["approved", "published", "completed"].includes(item.status)) continue;
    const days = daysUntil(item.due_date);
    const detail = `${item.brand_name || "Untitled brand"} · ${item.title || "Deliverable"}`;
    if (days < 0) items.push({ label: "Deliverable overdue", detail, tone: "danger", to: `/deals/${item.deal_id}` });
    else if (days <= 1) items.push({ label: days === 0 ? "Deliverable due today" : "Deliverable due tomorrow", detail, tone: "warn", to: `/deals/${item.deal_id}` });
    else if (["submitted", "changes_requested"].includes(item.status)) items.push({ label: "Brand approval pending", detail, tone: "info", to: `/deals/${item.deal_id}` });
  }
  for (const contract of contracts) { if (contract.expiry_state === "awaiting_signature") items.push({ label: "Contract awaiting signature", detail: contract.brand_name || "Contract", tone: "info", to: "/contracts" }); }
  return items;
}
function buildPipeline(deals) { const stages = ["pending", "active", "completed", "overdue"].map((key) => ({ key, label: key[0].toUpperCase() + key.slice(1), count: 0 })); for (const deal of deals) { const stage = stages.find((item) => item.key === deal.status); if (stage) stage.count += 1; } return stages; }
function buildPaymentStatus({ deals, money }) { return [{ key: "paid", label: "Collected", value: deals.filter((deal) => deal.status === "completed").reduce((sum, deal) => sum + totalEarned(deal), 0) }, { key: "pending", label: "Pending", value: Number(money?.summary?.pending || 0) }, { key: "overdue", label: "Overdue", value: Number(money?.summary?.overdue || 0) }]; }
function buildUpcomingWork(deliverables) { return [...deliverables].filter((item) => item.due_date && daysUntil(item.due_date) >= 0 && !["approved", "published", "completed"].includes(item.status)).sort((a, b) => parseDate(a.due_date) - parseDate(b.due_date)).slice(0, 6); }
function buildBrandPerformance(deals) { const map = new Map(); for (const deal of deals) { if (deal.status === "completed") map.set(deal.brand_name, (map.get(deal.brand_name) || 0) + totalEarned(deal)); } return [...map].map(([brand, revenue]) => ({ brand, revenue })).sort((a, b) => b.revenue - a.revenue); }
function buildInsights({ intelligence, deals, money, currency }) {
  const insights = []; const totals = intelligence?.totals || {};
  if (totals.repeatBrands) insights.push(`${totals.repeatBrands} repeat brand relationship${totals.repeatBrands === 1 ? "" : "s"} in your recorded history.`);
  if (totals.avgPaymentDays != null) insights.push(`Average recorded payment window: ${totals.avgPaymentDays} days.`);
  if (Number(money?.summary?.expected) > 0) insights.push(`${formatMoney(money.summary.expected, currency)} expected across open deals.`);
  if (!insights.length) insights.push(deals.length ? "Add payment dates and completed deals to build a clearer picture of your business." : "Your first recorded deal is the starting point for your business insights.");
  return insights.slice(0, 3);
}
function countUpcomingPayments(deals) { return deals.filter((deal) => deal.status !== "completed" && deal.payment_due_date && daysUntil(deal.payment_due_date) >= 0 && daysUntil(deal.payment_due_date) <= 30).length; }
function nextAction(deal) { return ({ overdue: "Follow up on payment", pending: "Confirm scope", active: "Track deliverables" })[deal.status] || "Review"; }
function deadlineFor(deal) { const value = deal.posting_date || deal.payment_due_date; if (!value) return "No deadline"; const days = daysUntil(value); return days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : `${days}d left`; }
function daysUntil(value) { if (!value) return Infinity; const date = parseDate(value); if (Number.isNaN(date.getTime())) return Infinity; const today = new Date(); return Math.round((new Date(date.getFullYear(), date.getMonth(), date.getDate()) - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000); }
function statusLabel(value) { const label = String(value || "pending").replaceAll("_", " "); return label[0].toUpperCase() + label.slice(1); }
function timeGreeting() { const hour = new Date().getHours(); return hour < 5 ? "Good night" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : hour < 21 ? "Good evening" : "Good night"; }
