import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { fetchMoneyCockpit } from "../lib/api";
import { formatMoney, num } from "../utils/deals";

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

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const next = await fetchMoneyCockpit();
      setData(next);
    } catch {
      setError("Could not load money dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const maxMonth = useMemo(
    () => Math.max(1, ...(data?.revenueByMonth || []).map((item) => num(item.revenue))),
    [data]
  );
  const maxFlow = useMemo(
    () => Math.max(1, ...(data?.expectedCashFlow || []).map((item) => num(item.expected)), num(data?.summary?.expected)),
    [data]
  );

  if (loading) return <div className="money-page"><div className="money-empty">Loading money dashboard...</div></div>;
  if (error) return <div className="money-page"><div className="money-empty">{error}</div></div>;

  const s = data.summary;
  const expectedCashFlow = (data.expectedCashFlow || []).length
    ? data.expectedCashFlow
    : num(s.expected) > 0
      ? [{ key: "pending-total", label: "Pending deals", expected: s.expected }]
      : [];

  return (
    <div className="money-page">
      <Helmet><title>Money - Brandio</title></Helmet>

      <header className="money-hero">
        <div>
          <span>Brandio Money</span>
          <h1>Creator finance, without the spreadsheet fog.</h1>
          <p>Recorded deal money, expected cash flow, and planning reserves in one place.</p>
        </div>
        <div className="money-reserve-card">
          <div className="money-label">Suggested reserve</div>
          <strong>{formatMoney(data.taxReserve.suggested_reserve)}</strong>
          <p>{data.taxReserve.percentage}% of recorded paid revenue</p>
          <small>{data.taxReserve.disclaimer}</small>
        </div>
      </header>

      <section className="money-stat-grid">
        <Stat label="Earned this month" value={s.earned_this_month} />
        <Stat label="Pending" value={s.pending} />
        <Stat label="Overdue" value={s.overdue} tone="danger" />
        <Stat label="Expected" value={s.expected} />
        <Stat label="Paid" value={s.paid} />
        <Stat label="Net earnings" value={s.net_earnings} note="Paid minus recorded expenses" />
      </section>

      <section className="money-grid-two">
        <div className="money-panel">
          <div className="money-panel-head">
              <h2>Revenue trend</h2>
              <p>Actual recorded completed revenue by month.</p>
            </div>
          <RevenueTrend data={data.revenueByMonth || []} max={maxMonth} />
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
                <strong>{formatCompactMoney(item.expected)}</strong>
              </div>
            ))}
            {!expectedCashFlow.length && <div className="money-empty-inline">No expected cash flow yet.</div>}
          </div>
        </div>
      </section>

      <section className="money-grid-four">
        <Breakdown title="Revenue by brand" rows={data.revenueByBrand} labelKey="brand" />
        <Breakdown title="Revenue by platform" rows={data.revenueByPlatform} labelKey="platform" />
        <Breakdown title="Revenue by deal type" rows={data.revenueByDealType.map((r) => ({ ...r, deal_type: dealTypeLabel[r.deal_type] || r.deal_type }))} labelKey="deal_type" />
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

function RevenueTrend({ data, max }) {
  if (!data.length) {
    return <div className="money-empty-inline">No completed revenue yet.</div>;
  }

  const width = 680;
  const height = 260;
  const pad = { top: 18, right: 18, bottom: 42, left: 58 };
  const points = data.map((item, index) => {
    const x = data.length === 1
      ? pad.left + (width - pad.left - pad.right) / 2
      : pad.left + (index / (data.length - 1)) * (width - pad.left - pad.right);
    const y = pad.top + (1 - num(item.revenue) / max) * (height - pad.top - pad.bottom);
    return { ...item, x, y };
  });
  const line = points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
  const area = `${line} L ${points.at(-1).x} ${height - pad.bottom} L ${points[0].x} ${height - pad.bottom} Z`;
  const ticks = [0, 0.5, 1].map((ratio) => ({
    y: pad.top + (1 - ratio) * (height - pad.top - pad.bottom),
    value: max * ratio
  }));

  return (
    <div className="money-trend-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Revenue trend by month">
        <defs>
          <linearGradient id="moneyTrendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {ticks.map((tick) => (
          <g key={tick.y}>
            <line className="money-trend-gridline" x1={pad.left} x2={width - pad.right} y1={tick.y} y2={tick.y} />
            <text className="money-trend-axis" x={pad.left - 10} y={tick.y + 4} textAnchor="end">{formatCompact(tick.value)}</text>
          </g>
        ))}
        <path className="money-trend-area" d={area} />
        <path className="money-trend-line" d={line} />
        {points.map((point) => (
          <g className="money-trend-point" key={point.key}>
            <circle cx={point.x} cy={point.y} r="5" />
            <title>{point.label}: {formatMoney(point.revenue)}</title>
          </g>
        ))}
        {points.map((point) => (
          <g key={`${point.key}-label`}>
            <text className="money-trend-axis" x={point.x} y={height - 20} textAnchor="middle">{point.label}</text>
            <text className="money-trend-value" x={point.x} y={height - 5} textAnchor="middle">{formatCompact(point.revenue)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function Breakdown({ title, rows, labelKey }) {
  const max = Math.max(1, ...(rows || []).map((row) => num(row.revenue)));
  return (
    <div className="money-panel money-breakdown">
      <h2>{title}</h2>
      {(rows || []).map((row) => (
        <div className="money-break-row" key={row[labelKey] || "Unknown"}>
          <div>
            <span>{row[labelKey] || "Unknown"}</span>
            <strong>{formatCompactMoney(row.revenue)}</strong>
          </div>
          <i><b style={{ width: `${Math.max(4, (num(row.revenue) / max) * 100)}%` }} /></i>
        </div>
      ))}
      {!(rows || []).length && <div className="money-empty-inline">No completed revenue yet.</div>}
    </div>
  );
}

function formatCompact(value) {
  const next = Number(value) || 0;
  if (next >= 10000000) return `${Math.round(next / 1000000) / 10}Cr`;
  if (next >= 100000) return `${Math.round(next / 10000) / 10}L`;
  if (next >= 1000) return `${Math.round(next / 100) / 10}k`;
  return String(Math.round(next));
}

function formatCompactMoney(value) {
  return `₹${formatCompact(value)}`;
}
