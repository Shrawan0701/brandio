import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useToast } from "../components/ToastProvider";
import { fetchRoi } from "../lib/api";

/* DEAL ROI - aggregate creator-side campaign economics.
   Net = revenue - expenses. Hourly = net / hours spent.
   Computed ONLY from data the creator entered. */

const money = (v, currency = "\u20B9") => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const str =
    abs >= 100000 ? `${(n / 100000).toFixed(1)}L` :
    abs >= 1000 ? `${(n / 1000).toFixed(abs >= 10000 ? 0 : 1)}k` :
    `${Math.round(n)}`;
  return `${currency}${str}`;
};

const first = (...vals) => vals.find((v) => v !== undefined && v !== null);

export default function Roi() {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetchRoi();
        if (alive) setData(res || {});
      } catch {
        if (alive) showToast("Could not load ROI data", "error");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [showToast]);

  const view = useMemo(() => {
    if (!data) return null;
    const s = data.summary || data.summary_stats || data.totals || {};
    const currency = first(data.currency, s.currency, "\u20B9");
    const byBrand = data.by_brand || data.byBrand || data.brands || [];
    const byPlatform = data.by_platform || data.byPlatform || data.platforms || [];
    const top = data.top_campaigns || data.topCampaigns || data.highest || data.top || [];
    const timeline = data.timeline || data.monthly || [];
    const deals = data.deals || data.campaigns || [];
    const revenue = Number(first(s.total_revenue, s.revenue, 0));
    const expenses = Number(first(s.total_expenses, s.expenses, 0));
    const net = Number(first(s.total_net, s.net, revenue - expenses));
    const hours = Number(first(s.total_hours, s.hours, 0));
    const tracked = Number(first(s.deals_tracked, s.deals_with_data, deals.length, s.deals || 0));
    const hourly = Number(first(s.avg_hourly, s.avg_hourly_earnings, s.hourly)) || (hours > 0 ? net / hours : 0);
    return { currency, revenue, expenses, net, hours, tracked, hourly, byBrand, byPlatform, top, timeline, deals };
  }, [data]);

  const hasData = view && (view.tracked > 0 || view.revenue > 0 || view.hours > 0);

  const barList = (rows, valueKey) => {
    const items = (rows || [])
      .map((r) => ({ name: r.name || r.brand_name || r.platform || "—", value: Number(r[valueKey]) || 0, hours: Number(r.hours) || 0 }))
      .filter((r) => r.value !== 0 || r.hours !== 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
    const max = Math.max(1, ...items.map((i) => i.value));
    return { items, max };
  };

  const BarChart = ({ title, timeline: rows }) => {
    const dataRows = rows || [];
    const maxVal = Math.max(1, ...dataRows.map((m) => Math.max(Number(m.revenue) || 0, Number(m.expenses) || 0)));
    return (
      <div className="cr-chart">
        <div className="cr-chart-title">{title}</div>
        {dataRows.length === 0 ? (
          <p className="cr-section-sub" style={{ marginTop: 8 }}>Not enough data</p>
        ) : (
          <>
            <div className="cr-bars">
              {dataRows.map((m) => {
                const rev = Number(m.revenue) || 0;
                const exp = Number(m.expenses) || 0;
                return (
                  <div key={m.month} className="cr-bar-wrap">
                    <div className="cr-bar-fill" style={{ height: `${(rev / maxVal) * 100}%` }} />
                    {exp > 0 && <div className="cr-bar-fill expenses" style={{ height: `${(exp / maxVal) * 100}%`, marginTop: 2 }} />}
                    <span className="cr-bar-label">{m.month}</span>
                  </div>
                );
              })}
            </div>
            <div className="cr-bar-legend">
              <span><span className="dot" /> Revenue</span>
              <span><span className="dot expenses" /> Expenses</span>
            </div>
          </>
        )}
      </div>
    );
  };

  const Donut = ({ revenue, expenses, currency }) => {
    const safeRev = Math.max(0, Number(revenue) || 0);
    const safeExp = Math.max(0, Number(expenses) || 0);
    const total = safeRev + safeExp;
    if (total <= 0) {
      return (
        <div className="cr-donut-wrap">
          <div className="cr-donut"><div className="cr-donut-hole"><span className="cr-donut-center">\u2014</span></div></div>
          <div className="cr-donut-legend"><span>No revenue or expenses recorded</span></div>
        </div>
      );
    }
    const expPct = (safeExp / total) * 100;
    const conic = `conic-gradient(from 0deg, #0e6b3e 0deg ${expPct}deg, #3b5cff ${expPct}deg 100deg)`;
    return (
      <div className="cr-donut-wrap">
        <div className="cr-donut" style={{ background: conic }}>
          <div className="cr-donut-hole"><span className="cr-donut-center">{expPct.toFixed(0)}%</span></div>
        </div>
        <div className="cr-donut-legend">
          <span><span className="swatch" style={{ background: "#b42318" }} /> Expenses {money(safeExp, currency)}</span>
          <span><span className="swatch" style={{ background: "#3b5cff" }} /> Net {money(safeRev, currency)}</span>
        </div>
      </div>
    );
  };

  const HorizBars = ({ rows, valueKey, colors }) => {
    const { items, max } = barList(rows, valueKey);
    return items.length === 0 ? (
      <p className="cr-section-sub" style={{ marginTop: 8 }}>Not enough data</p>
    ) : (
      <ul className="cr-h-list">
        {items.map((it) => {
          const pct = (it.value / max) * 100;
          const cls = colors === "green" ? "green" : colors === "red" ? "red" : "";
          return (
            <li key={it.name} className="cr-h-row">
              <span className="cr-h-name" title={it.name}>{it.name}</span>
              <span className="cr-h-track"><span className={`cr-h-fill ${cls}`} style={{ width: `${pct}%` }} /></span>
              <span className="cr-h-value">{money(it.value, view?.currency)}</span>
              {it.hours > 0 && <span className="cr-li-sub">{it.hours}h</span>}
            </li>
          );
        })}
      </ul>
    );
  };

  return view === null ? (
    <div className="cr-shell">
      <div className="cr-stats">
        <div className="cr-stat"><div className="cr-stat-value">…</div><div className="cr-stat-label">Loading</div></div>
      </div>
    </div>
  ) : !hasData ? (
    <div className="cr-shell">
      <header className="cr-hero">
        <div>
          <span className="cr-eyebrow">ROI</span>
          <h1 className="cr-title">Campaign <span>ROI</span></h1>
          <p className="cr-subtitle">Once you log hours, expenses and earnings on completed deals, your creator-side ROI breakdown shows up here.</p>
        </div>
      </header>
      <div className="cr-empty">
        <div className="cr-empty-icon">▤</div>
        <h3>No ROI data yet</h3>
        <p>Add revenue, hours spent and expenses to your completed deals to start tracking which campaigns were worth your time.</p>
      </div>
      <p className="cr-fineprint" style={{ marginTop: 16 }}>
        Only deals with creator-entered effort data are counted. No benchmarks are fabricated.
      </p>
    </div>
  ) : (
    <div className="cr-shell">
      <Helmet>
        <title>Deal ROI - Brandio</title>
        <meta name="description" content="Creator-side ROI for completed brand deals — net earnings, hourly rate, expenses and revenue over time." />
      </Helmet>

      <header className="cr-hero">
        <div>
          <span className="cr-eyebrow">ROI</span>
          <h1 className="cr-title">Campaign <span>ROI</span></h1>
          <p className="cr-subtitle">Creator-side economics for completed deals — net earnings versus time invested, never fabricated.</p>
        </div>
        <div className="cr-stats">
          <div className="cr-stat"><div className="cr-stat-value">{money(view.net, view.currency)}</div><div className="cr-stat-label">Net earnings</div><div className="cr-stat-note">{view.tracked} deals tracked</div></div>
          <div className="cr-stat"><div className="cr-stat-value">{money(view.expenses, view.currency)}</div><div className="cr-stat-label">Expenses</div></div>
          <div className="cr-stat"><div className="cr-stat-value">{view.hours > 0 ? view.hours : "—"}</div><div className="cr-stat-label">Hours</div></div>
          <div className="cr-stat"><div className="cr-stat-value">{view.hourly > 0 ? money(view.hourly, view.currency) + "/h" : "—"}</div><div className="cr-stat-label">Avg hourly</div></div>
        </div>
      </header>

      <div className="cr-section">
        <div className="cr-section-head"><h2 className="cr-section-title">Key insights</h2></div>
        <div className="cr-grid">
          <div className="cr-insight cr-insight-accent">
            <div className="cr-insight-title">Best value brand</div>
            <p className="cr-insight-ink">Your highest-value brand relationship by net earnings is <strong>{view.byBrand[0]?.name || "Not enough data"}</strong> at {money(view.byBrand[0]?.net ?? 0, view.currency)}.</p>
          </div>
          <div className="cr-insight cr-insight-green">
            <div className="cr-insight-title">Net vs revenue</div>
            <p className="cr-insight-ink">You kept <strong>{view.revenue > 0 ? Math.round((view.net / view.revenue) * 100) : 0}%</strong> of campaign revenue after creator-side expenses.</p>
          </div>
          {view.hourly > 0 ? (
            <div className="cr-insight cr-insight-amber">
              <div className="cr-insight-title">Effective hourly rate</div>
              <p className="cr-insight-ink">Across deals where you logged time, your average effective earnings are <strong>{money(view.hourly, view.currency)}/hour</strong>.</p>
            </div>
          ) : (
            <div className="cr-insight cr-insight-amber">
              <div className="cr-insight-title">Effective hourly rate</div>
              <p className="cr-insight-ink">Not enough data — log <strong>hours spent</strong> on completed deals to compute your real hourly rate.</p>
            </div>
          )}
        </div>
      </div>

      <div className="cr-section">
        <div className="cr-section-head">
          <h2 className="cr-section-title">Revenue vs expenses over time</h2>
          <p className="cr-section-sub">Last months of completed, tracked deals.</p>
        </div>
        <BarChart title="Revenue vs expenses" timeline={view.timeline} />
      </div>

      <div className="cr-row">
        <div className="cr-row-half">
          <div className="cr-section-head"><h2 className="cr-section-title">Expenses vs revenue</h2></div>
          <div className="cr-chart"><Donut revenue={view.revenue} expenses={view.expenses} currency={view.currency} /></div>
        </div>
        <div className="cr-row-half">
          <div className="cr-section-head"><h2 className="cr-section-title">ROI by platform</h2></div>
          <div className="cr-chart"><HorizBars rows={view.byPlatform} valueKey="net" colors="green" /></div>
        </div>
      </div>

      <div className="cr-section">
        <div className="cr-section-head"><h2 className="cr-section-title">ROI by brand</h2><p className="cr-section-sub">By net earnings across your completed deals.</p></div>
        <div className="cr-chart"><HorizBars rows={view.byBrand} valueKey="net" /></div>
      </div>

      <div className="cr-section">
        <div className="cr-section-head">
          <h2 className="cr-section-title">Highest-value campaigns</h2>
          <p className="cr-section-sub">Completed deals ranked by net earnings.</p>
        </div>
        {view.top.length === 0 ? (
          <p className="cr-section-sub">Not enough data — log hours on completed deals to rank them.</p>
        ) : (
          <div className="cr-table-wrap">
            <table className="cr-table">
              <thead>
                <tr><th>Deal</th><th>Brand</th><th>Platform</th><th style={{ textAlign: "right" }}>Revenue</th><th style={{ textAlign: "right" }}>Expenses</th><th style={{ textAlign: "right" }}>Net</th></tr>
              </thead>
              <tbody>
                {view.top.map((d) => (
                  <tr key={d.id}>
                    <td className="cr-table-name">{d.title || `${d.brand_name || "Deal"} #${d.id}`}<small>{d.roi_notes ? d.roi_notes.slice(0, 48) : ""}</small></td>
                    <td>{d.brand_name || "—"}</td>
                    <td>{d.platform_custom || d.platform || "—"}</td>
                    <td className="cr-table-amount" style={{ textAlign: "right" }}>{money(d.amount, d.currency)}</td>
                    <td style={{ textAlign: "right" }}>{money(d.expenses, d.currency)}</td>
                    <td className="cr-table-amount" style={{ textAlign: "right" }}>{money(d.amount ? Number(d.amount) - Number(d.expenses || 0) : 0, d.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="cr-fineprint">
        ROI uses only the hours, expenses and earnings you entered on completed deals. Fields left blank show “Not enough data”.
      </p>
    </div>
  );
}
