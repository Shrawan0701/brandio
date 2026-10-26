import RevenueChart from "../components/RevenueChart";
import { WorkspaceHeader, WorkspaceStats, WorkspaceIcon } from "../components/WorkspaceUI";
import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { fetchMoneyCockpit } from "../lib/api";
import { currencySymbol, formatMoney, num } from "../utils/deals";

const dealTypeLabel = {
  paid: "Paid",
  gifted: "Gifted",
  barter: "Barter",
  affiliate: "Affiliate",
  commission: "Commission",
  hybrid: "Hybrid"
};

export default function Money() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const next = await fetchMoneyCockpit(selectedCurrency);
      setData(next);
    } catch {
      setError("Could not load money dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [selectedCurrency]);

  const maxFlow = useMemo(
    () => Math.max(1, ...(data?.expectedCashFlow || []).map((item) => num(item.expected)), num(data?.summary?.expected)),
    [data]
  );

  if (loading) return <div className="money-page workspace-page"><div className="money-empty">Loading money dashboard...</div></div>;
  if (error) return <div className="money-page workspace-page"><div className="money-empty">{error}</div></div>;

  const s = data.summary;
  const currency = data.currency;
  const expectedCashFlow = (data.expectedCashFlow || []).length
    ? data.expectedCashFlow
    : num(s.expected) > 0
      ? [{ key: "pending-total", label: "Pending deals", expected: s.expected }]
      : [];

  return (
    <div className="money-page workspace-page">
      <Helmet><title>Money - Brandio</title></Helmet>

      <WorkspaceHeader eyebrow="Main / Money" title="Money" description="Your recorded revenue, open payments, and expected cash flow at a glance." />
      {data.availableCurrencies?.length > 1 && <label className="money-currency-select">Currency <select aria-label="Money currency" value={currency} onChange={(event) => setSelectedCurrency(event.target.value)}>{data.availableCurrencies.map((code) => <option key={code} value={code}>{code}</option>)}</select></label>}
      {data.taxReserve && <section className="ws-note money-reserve-note"><WorkspaceIcon name="money" /><div><strong>Suggested reserve: {formatMoney(data.taxReserve.suggested_reserve, currency)}</strong><p>{data.taxReserve.percentage}% of recorded paid revenue. {data.taxReserve.disclaimer}</p></div></section>}

      <WorkspaceStats items={[
        { label: "Earned this month", value: formatMoney(s.earned_this_month, currency), note: "Recorded completed revenue", icon: "money" },
        { label: "Pending", value: formatMoney(s.pending, currency), note: "Open payment balance", icon: "clock", tone: "amber" },
        { label: "Overdue", value: formatMoney(s.overdue, currency), note: "Payments to follow up", icon: "alert", tone: "red" },
        { label: "Expected", value: formatMoney(s.expected, currency), note: "Across open deals", icon: "calendar", tone: "blue" },
        { label: "Paid", value: formatMoney(s.paid, currency), note: "Recorded paid revenue", icon: "check", tone: "green" },
        { label: "Net earnings", value: formatMoney(s.net_earnings, currency), note: "Paid minus recorded expenses", icon: "chart" }
      ]} />

      <section className="money-grid-two">
        <div className="money-panel">
          <div className="money-panel-head">
              <h2>Revenue trend</h2>
              <p>Actual recorded completed revenue by month.</p>
            </div>
          <RevenueChart data={data.revenueByMonth || []} currency={currency} />
        </div>

        <div className="money-panel">
          <div className="money-panel-head">
            <h2>Expected cash flow</h2>
            <p>Open deal value grouped by due month.</p>
          </div>
          <div className="money-flow-list">
            {expectedCashFlow.map((item) => (
              <div key={item.key}>
                <span>{item.label}</span>
                <div><i style={{ width: `${Math.max(4, (num(item.expected) / maxFlow) * 100)}%` }} /></div>
                <strong>{formatCompactMoney(item.expected, currency)}</strong>
              </div>
            ))}
            {!expectedCashFlow.length && <div className="money-empty-inline">No expected cash flow yet.</div>}
          </div>
        </div>
      </section>

      <section className="money-grid-four">
        <Breakdown title="Revenue by brand" rows={data.revenueByBrand} labelKey="brand" currency={currency} />
        <Breakdown title="Revenue by platform" rows={data.revenueByPlatform} labelKey="platform" currency={currency} />
        <Breakdown title="Revenue by deal type" rows={data.revenueByDealType.map((r) => ({ ...r, deal_type: dealTypeLabel[r.deal_type] || r.deal_type }))} labelKey="deal_type" currency={currency} />
      </section>

   
    </div>
  );
}

function Stat({ label, value, note, tone }) {
  return (
    <div className={`money-stat ${tone || ""}`}>
      <span>{label}</span>
      <strong>{formatMoney(value)}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}

function Breakdown({ title, rows, labelKey, currency }) {
  const max = Math.max(1, ...(rows || []).map((row) => num(row.revenue)));
  return (
    <div className="money-panel money-breakdown">
      <h2>{title}</h2>
      {(rows || []).map((row) => (
        <div className="money-break-row" key={row[labelKey] || "Unknown"}>
          <div>
            <span>{row[labelKey] || "Unknown"}</span>
            <strong>{formatCompactMoney(row.revenue, currency)}</strong>
          </div>
          <i><b style={{ width: `${Math.max(4, (num(row.revenue) / max) * 100)}%` }} /></i>
        </div>
      ))}
      {!(rows || []).length && <div className="money-empty-inline">No completed revenue yet.</div>}
    </div>
  );
}

function formatCompact(value, currency) {
  const next = Number(value) || 0;
  if (currency === "USD" && next >= 1000000) return `${Math.round(next / 100000) / 10}m`;
  if (currency === "USD" && next >= 1000) return `${Math.round(next / 100) / 10}k`;
  if (next >= 10000000) return `${Math.round(next / 1000000) / 10}Cr`;
  if (next >= 100000) return `${Math.round(next / 10000) / 10}L`;
  if (next >= 1000) return `${Math.round(next / 100) / 10}k`;
  return String(Math.round(next));
}

function formatCompactMoney(value, currency) {
  return `${currencySymbol(currency)}${formatCompact(value, currency)}`;
}
