import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useToast } from "../components/ToastProvider";
import { fetchIntelligence } from "../lib/api";
import { fmtMoney, fmtNum, maxOf, barPct } from "../utils/intelligence";

/* =========================================================
   BRANDIO INTELLIGENCE · insights computed ONLY from the
   creator's own deals (+ portfolio metrics when present).
   No benchmarks, no invented data — empty states when thin.
   ========================================================= */

const TONE_ICON = {
  avg: "◈", platform: "▣", brand: "★", payment: "◷",
  month: "✔", delta: "▲", pending: "●"
};

export default function Intelligence() {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await fetchIntelligence();
        if (alive) setData(d);
      } catch (err) {
        if (err.response?.status === 403) {
          if (alive) setLocked(true);
        } else {
          showToast("Could not load intelligence", "error");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [showToast]);

  if (loading) {
    return (
      <div className="bi-page"><div className="bi-shell">
        <p className="bi-muted">Reading your deal history…</p>
      </div></div>
    );
  }

  if (locked) {
    return (
      <div className="bi-page"><div className="bi-shell">
        <div className="bi-empty">
          <h2>Intelligence is a Pro feature</h2>
          <p>Upgrade to turn your deal history into business insights.</p>
          <a className="bi-cta" href="/pricing">View plans</a>
        </div>
      </div></div>
    );
  }

  const t = data?.totals || {};
  const revenueTrend = withTrendFallback(data?.revenueTrend || [], {
    revenue: t.totalEarned || 0,
    deals: t.completedCount || 0
  });
  const avgTrend = withAverageFallback(data?.avgTrend || [], t.avgDealValue || 0);
  const revMax = maxOf(revenueTrend, (r) => r.revenue);
  const avgMax = maxOf(avgTrend, (r) => r.value);
  const platMax = maxOf(data?.platformRevenue, (r) => r.revenue);
  const brandMax = maxOf(data?.brandRevenue, (r) => r.revenue);
  const thin = (t.totalDeals || 0) === 0;

  const cards = [
    { label: "Total earned", value: fmtMoney(t.totalEarned), sub: `${t.completedCount || 0} completed deals` },
    { label: "Average deal value", value: fmtMoney(t.avgDealValue), sub: `This year: ${fmtMoney(t.avgThisYear)}` },
    { label: "Pending amount", value: fmtMoney(t.pendingAmount), sub: `${t.activeCount || 0} open deals` },
    { label: "Completed deals", value: String(t.completedCount || 0), sub: t.avgPaymentDays != null ? `Avg payment window ${t.avgPaymentDays}d` : "Recorded completed campaigns" }
  ];

  return (
    <div className="bi-page">
      <Helmet>
        <title>Intelligence - Brandio</title>
        <meta name="description" content="Business intelligence from your own Brandio deals." />
      </Helmet>
      <div className="bi-shell">
        <header className="bi-hero">
          <div>
            <span className="bi-eyebrow">Business intelligence</span>
            <h1 className="bi-title">Brandio <span>Intelligence</span></h1>
            <p className="bi-sub">Every number below comes from your own deals. Nothing is estimated.</p>
          </div>
          {t.revenueDeltaPctRounded != null && (
            <div className={`bi-delta ${t.revenueDeltaPctRounded >= 0 ? "up" : "down"}`}>
              {t.revenueDeltaPctRounded >= 0 ? "▲" : "▼"} {Math.abs(t.revenueDeltaPctRounded)}% vs last month
            </div>
          )}
        </header>

        <div className="bi-cards">
          {cards.map((c) => (
            <div key={c.label} className="bi-card">
              <div className="bi-card-label">{c.label}</div>
              <div className="bi-card-value">{c.value}</div>
              <div className="bi-card-sub">{c.sub}</div>
            </div>
          ))}
        </div>

        {thin && (
          <div className="bi-empty">
            <h2>No deal history yet</h2>
            <p>Add your first deal on the dashboard and trends will appear here.</p>
            <a className="bi-cta" href="/dashboard">Go to dashboard</a>
          </div>
        )}

        {!thin && (
          <>
            <section className="bi-panel">
              <h2>Revenue trend · last 6 months</h2>
              <TrendLine data={revenueTrend} max={revMax} />
            </section>

            <div className="bi-grid2">
              <section className="bi-panel">
                <h2>Deal volume</h2>
                <div className="bi-vol">
                  {revenueTrend.map((r) => (
                    <div key={r.key} className="bi-vol-row">
                      <span>{r.label}</span><strong>{r.deals}</strong>
                    </div>
                  ))}
                </div>
              </section>
              <section className="bi-panel">
                <h2>Average deal value</h2>
                <AverageDealRows data={avgTrend} max={avgMax} />
              </section>
            </div>

            <div className="bi-grid2">
              <section className="bi-panel">
                <h2>Platform revenue</h2>
                {(data.platformRevenue || []).map((p) => (
                  <div key={p.platform} className="bi-split-row">
                    <div className="bi-split-top"><span>{p.platform}</span><span>{fmtMoney(p.revenue)} · {p.deals}</span></div>
                    <div className="bi-split-track"><div className="bi-split-fill" style={{ width: `${barPct(p.revenue, platMax)}%` }} /></div>
                  </div>
                ))}
                {!(data.platformRevenue || []).length && <p className="bi-muted">Complete a deal to see platform earnings.</p>}
              </section>
              <section className="bi-panel">
                <h2>Brand revenue</h2>
                {(data.brandRevenue || []).map((b) => (
                  <div key={b.brand} className="bi-split-row">
                    <div className="bi-split-top"><span>{b.brand}</span><span>{fmtMoney(b.revenue)} · {b.deals}</span></div>
                    <div className="bi-split-track"><div className="bi-split-fill violet" style={{ width: `${barPct(b.revenue, brandMax)}%` }} /></div>
                  </div>
                ))}
                {!(data.brandRevenue || []).length && <p className="bi-muted">Complete a deal to rank brands.</p>}
              </section>
            </div>

            <div className="bi-grid2">
              <section className="bi-panel">
                <h2>Completed vs active</h2>
                <div className="bi-status">
                  {(data.statusSplit || []).map((s) => (
                    <div key={s.label} className="bi-status-row">
                      <span>{s.label}</span><strong>{s.value}</strong>
                    </div>
                  ))}
                </div>
                {t.repeatBrands > 0 && <p className="bi-muted">{t.repeatBrands} repeat brand{t.repeatBrands === 1 ? "" : "s"}.</p>}
              </section>
              <section className="bi-panel">
                <h2>Pending payments</h2>
                <div className="bi-pending">{fmtMoney(t.pendingAmount)}</div>
                <p className="bi-muted">Across {t.activeCount || 0} open deals{t.overdueCount ? ` · ${t.overdueCount} overdue` : ""}.</p>
                {data.performance && (
                  <p className="bi-muted">Tracked content: {fmtNum(data.performance.totalViews)} views · {fmtNum(data.performance.totalLikes)} likes.</p>
                )}
              </section>
            </div>

            <section className="bi-panel">
              <h2>What your data says</h2>
              <div className="bi-insights">
                {(data.insights || []).map((i) => (
                  <div key={i.id} className={`bi-insight ${i.tone}`}>
                    <span className="bi-insight-ico">{TONE_ICON[i.icon] || "◈"}</span>
                    <p>{i.text}</p>
                  </div>
                ))}
              </div>
            </section>

          </>
        )}
      </div>
    </div>
  );
}

function TrendLine({ data, max }) {
  if (!data.length) return <p className="bi-muted">No trend data yet.</p>;

  const width = 760;
  const height = 240;
  const pad = { top: 18, right: 18, bottom: 40, left: 58 };
  const safeMax = Math.max(1, max || 0);
  const points = data.map((item, index) => {
    const value = Number(item.revenue) || 0;
    const x = data.length === 1
      ? pad.left + (width - pad.left - pad.right) / 2
      : pad.left + (index / (data.length - 1)) * (width - pad.left - pad.right);
    const y = pad.top + (1 - value / safeMax) * (height - pad.top - pad.bottom);
    return { ...item, value, x, y };
  });
  const line = points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
  const area = `${line} L ${points.at(-1).x} ${height - pad.bottom} L ${points[0].x} ${height - pad.bottom} Z`;
  const ticks = [0, 0.5, 1].map((ratio) => ({
    y: pad.top + (1 - ratio) * (height - pad.top - pad.bottom),
    value: safeMax * ratio
  }));

  return (
    <div className="bi-trend-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Revenue trend">
        <defs>
          <linearGradient id="biRevenueArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {ticks.map((tick) => (
          <g key={tick.y}>
            <line className="bi-trend-gridline" x1={pad.left} x2={width - pad.right} y1={tick.y} y2={tick.y} />
            <text className="bi-trend-axis" x={pad.left - 10} y={tick.y + 4} textAnchor="end">{fmtNum(tick.value)}</text>
          </g>
        ))}
        <path className="bi-trend-area" d={area} />
        <path className="bi-trend-line" d={line} />
        {points.map((point) => (
          <g className="bi-trend-point" key={point.key}>
            <circle cx={point.x} cy={point.y} r="5" />
            <title>{point.label}: {fmtNum(point.value)}</title>
          </g>
        ))}
        {points.map((point) => (
          <text className="bi-trend-axis" x={point.x} y={height - 12} textAnchor="middle" key={`${point.key}-label`}>{point.label}</text>
        ))}
      </svg>
    </div>
  );
}

function withTrendFallback(rows, totals) {
  if (!rows.length || !totals.revenue) return rows;
  const hasRevenue = rows.some((row) => Number(row.revenue) > 0);
  if (hasRevenue) return rows;
  return rows.map((row, index) => (
    index === rows.length - 1
      ? { ...row, revenue: totals.revenue, deals: totals.deals || row.deals || 0 }
      : row
  ));
}

function withAverageFallback(rows, avgDealValue) {
  if (!rows.length || !avgDealValue) return rows;
  const hasAverage = rows.some((row) => Number(row.value) > 0);
  if (hasAverage) return rows;
  return rows.map((row, index) => (
    index === rows.length - 1 ? { ...row, value: avgDealValue } : row
  ));
}

function AverageDealRows({ data, max }) {
  if (!data.length) return <p className="bi-muted">No average deal data yet.</p>;
  const safeMax = Math.max(1, max || 0);
  return (
    <div className="bi-avg-rows">
      {data.map((item) => {
        const value = Number(item.value) || 0;
        return (
          <div className="bi-avg-row" key={item.key}>
            <span>{item.label}</span>
            <div><i style={{ width: `${Math.max(value ? 5 : 0, (value / safeMax) * 100)}%` }} /></div>
            <strong>{value ? fmtNum(value) : "No data"}</strong>
          </div>
        );
      })}
    </div>
  );
}


