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
  const revMax = maxOf(data?.revenueTrend, (r) => r.revenue);
  const avgMax = maxOf(data?.avgTrend, (r) => r.value);
  const platMax = maxOf(data?.platformRevenue, (r) => r.revenue);
  const brandMax = maxOf(data?.brandRevenue, (r) => r.revenue);
  const thin = (t.totalDeals || 0) === 0;

  const cards = [
    { label: "Total earned", value: fmtMoney(t.totalEarned), sub: `${t.completedCount || 0} completed deals` },
    { label: "Average deal value", value: fmtMoney(t.avgDealValue), sub: `This year: ${fmtMoney(t.avgThisYear)}` },
    { label: "Pending amount", value: fmtMoney(t.pendingAmount), sub: `${t.activeCount || 0} open deals` },
    { label: "Completed this month", value: String(t.completedThisMonth || 0), sub: t.avgPaymentDays != null ? `Avg payment window ${t.avgPaymentDays}d` : "Payment window unknown yet" }
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
              <div className="bi-bars">
                {(data.revenueTrend || []).map((r) => (
                  <div key={r.key} className="bi-bar-col">
                    <div className="bi-bar-track">
                      <div className="bi-bar-fill" style={{ height: `${barPct(r.revenue, revMax)}%` }} />
                    </div>
                    <div className="bi-bar-val">{r.revenue ? fmtNum(r.revenue) : "–"}</div>
                    <div className="bi-bar-lab">{r.label}</div>
                  </div>
                ))}
              </div>
            </section>

            <div className="bi-grid2">
              <section className="bi-panel">
                <h2>Deal volume</h2>
                <div className="bi-vol">
                  {(data.revenueTrend || []).map((r) => (
                    <div key={r.key} className="bi-vol-row">
                      <span>{r.label}</span><strong>{r.deals}</strong>
                    </div>
                  ))}
                </div>
              </section>
              <section className="bi-panel">
                <h2>Average deal value</h2>
                <div className="bi-bars slim">
                  {(data.avgTrend || []).map((r) => (
                    <div key={r.key} className="bi-bar-col">
                      <div className="bi-bar-track">
                        <div className="bi-bar-fill gold" style={{ height: `${barPct(r.value, avgMax)}%` }} />
                      </div>
                      <div className="bi-bar-val">{r.value ? fmtNum(r.value) : "–"}</div>
                      <div className="bi-bar-lab">{r.label}</div>
                    </div>
                  ))}
                </div>
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

