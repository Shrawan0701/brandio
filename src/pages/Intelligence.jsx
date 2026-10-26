import RevenueChart from "../components/RevenueChart";
import { WorkspaceHeader, WorkspaceStats } from "../components/WorkspaceUI";
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

const emptyIntelligence = {
  totals: {
    totalDeals: 0,
    totalEarned: 0,
    completedCount: 0,
    avgDealValue: 0,
    avgThisYear: 0,
    pendingAmount: 0,
    activeCount: 0
  },
  revenueTrend: [],
  avgTrend: [],
  platformRevenue: [],
  brandRevenue: [],
  statusSplit: [],
  insights: []
};

export default function Intelligence() {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await fetchIntelligence(selectedCurrency);
        if (alive) setData(d);
      } catch (err) {
        if (err.response?.status === 403) {
          if (alive) setData(emptyIntelligence);
        } else {
          showToast("Could not load intelligence", "error");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [showToast, selectedCurrency]);

  if (loading) {
    return (
      <div className="bi-page workspace-page"><div className="bi-shell">
        <p className="bi-muted">Reading your deal history…</p>
      </div></div>
    );
  }

  const t = data?.totals || {};
  const currency = data?.currency || "INR";
  const revenueTrend = data?.revenueTrend || [];
  const avgTrend = data?.avgTrend || [];
  const avgMax = maxOf(avgTrend, (r) => r.value);
  const platMax = maxOf(data?.platformRevenue, (r) => r.revenue);
  const brandMax = maxOf(data?.brandRevenue, (r) => r.revenue);
  const thin = (t.totalDeals || 0) === 0;

  const cards = [
    { label: "Total earned", value: fmtMoney(t.totalEarned, currency), sub: `${t.completedCount || 0} completed deals` },
    { label: "Average deal value", value: fmtMoney(t.avgDealValue, currency), sub: `This year: ${fmtMoney(t.avgThisYear, currency)}` },
    { label: "Pending amount", value: fmtMoney(t.pendingAmount, currency), sub: `${t.activeCount || 0} open deals` },
    { label: "Completed deals", value: String(t.completedCount || 0), sub: t.avgPaymentDays != null ? `Avg payment window ${t.avgPaymentDays}d` : "Recorded completed campaigns" }
  ];

  return (
    <div className="bi-page workspace-page">
      <Helmet>
        <title>Intelligence - Brandio</title>
        <meta name="description" content="Business intelligence from your own Brandio deals." />
      </Helmet>
      <div className="bi-shell">
        <WorkspaceHeader eyebrow="Main / Intelligence" title="Business intelligence" description="Trends and useful observations from your recorded deals and campaign performance." actions={t.revenueDeltaPctRounded != null ? <span className={`ws-trend ${t.revenueDeltaPctRounded >= 0 ? "up" : "down"}`}>{t.revenueDeltaPctRounded >= 0 ? "↗" : "↘"} {Math.abs(t.revenueDeltaPctRounded)}% vs last month</span> : null} />
        {data?.availableCurrencies?.length > 1 && <label>Currency <select aria-label="Intelligence currency" value={currency} onChange={(event) => setSelectedCurrency(event.target.value)}>{data.availableCurrencies.map((code) => <option key={code} value={code}>{code}</option>)}</select></label>}

        <WorkspaceStats items={cards.map((card, index) => ({ label: card.label, value: card.value, note: card.sub, icon: ["money", "chart", "clock", "check"][index], tone: ["purple", "blue", "amber", "green"][index] }))} />

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
              <RevenueChart data={revenueTrend} currency={currency} />
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
                    <div className="bi-split-top"><span>{p.platform}</span><span>{fmtMoney(p.revenue, currency)} · {p.deals}</span></div>
                    <div className="bi-split-track"><div className="bi-split-fill" style={{ width: `${barPct(p.revenue, platMax)}%` }} /></div>
                  </div>
                ))}
                {!(data.platformRevenue || []).length && <p className="bi-muted">Complete a deal to see platform earnings.</p>}
              </section>
              <section className="bi-panel">
                <h2>Brand revenue</h2>
                {(data.brandRevenue || []).map((b) => (
                  <div key={b.brand} className="bi-split-row">
                    <div className="bi-split-top"><span>{b.brand}</span><span>{fmtMoney(b.revenue, currency)} · {b.deals}</span></div>
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
                <div className="bi-pending">{fmtMoney(t.pendingAmount, currency)}</div>
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


