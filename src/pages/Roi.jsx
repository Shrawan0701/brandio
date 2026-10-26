import { WorkspaceHeader, WorkspaceStats } from "../components/WorkspaceUI";
﻿import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useToast } from "../components/ToastProvider";
import { fetchRoi } from "../lib/api";
import { computeDealRoi } from "../utils/roi";
import { currencySymbol } from "../utils/deals";

/* DEAL ROI - aggregate creator-side campaign economics.
   Net = revenue - expenses. Hourly = net / hours spent.
   Computed ONLY from data the creator entered. */

const money = (v, currency = "\u20B9") => {
  if (v == null) return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const isUsd = currency === "USD" || currency === "$";
  const str =
    isUsd && abs >= 1000000 ? `${Number((n / 1000000).toFixed(2))}m` :
    isUsd && abs >= 1000 ? `${Number((n / 1000).toFixed(1))}k` :
    abs >= 100000 ? `${Number((n / 100000).toFixed(2))}L` :
    abs >= 1000 ? `${(n / 1000).toFixed(abs >= 10000 ? 0 : 1)}k` :
    `${Math.round(n)}`;
  return `${currencySymbol(currency)}${str}`;
};

const first = (...vals) => vals.find((v) => v !== undefined && v !== null);

export default function Roi() {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const res = await fetchRoi(selectedCurrency);
        if (alive) setData(res || {});
      } catch {
        if (alive) {
          setError("Could not load ROI data. Please try again.");
          showToast("Could not load ROI data", "error");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [retry, showToast, selectedCurrency]);

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
    const tracked = Number(first(s.deals_tracked, s.deals_with_data, s.withData, s.deals, deals.length));
    const hourlyValue = s.avgHourly !== undefined ? s.avgHourly : first(s.avg_hourly, s.avg_hourly_earnings, s.hourly);
    const hourly = hourlyValue == null ? null : Number(hourlyValue);
    return { currency, revenue, expenses, net, hours, tracked, hourly, byBrand, byPlatform, top, timeline, deals };
  }, [data]);

  const hasData = view && (view.tracked > 0 || view.revenue !== 0 || view.expenses > 0 || view.hours > 0);

  const barList = (rows, valueKey) => {
    const items = (rows || [])
      .map((r) => ({ name: r.name || r.brand_name || r.platform || "—", value: Number(r[valueKey]) || 0, hours: Number(r.hours) || 0 }))
      .filter((r) => r.value !== 0 || r.hours !== 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
    const max = Math.max(1, ...items.map((i) => i.value));
    return { items, max };
  };

  const BarChart = ({ title, timeline: rows = [] }) => {
    if (!rows.length) return <p className="cr-section-sub">No monthly revenue or expenses recorded yet.</p>;
    const width = 640, height = 215, baseline = 178, left = 50, plotHeight = 153;
    const maximum = Math.max(1, ...rows.flatMap((row) => [Number(row.revenue) || 0, Number(row.expenses) || 0]));
    const slot = (width - left - 15) / rows.length;
    const barWidth = Math.min(28, slot * .22);
    return <div className="ws-roi-trend"><div className="ws-chart-legend"><span><i />Revenue</span><span><i className="expenses" />Expenses</span></div><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
      {[0, .5, 1].map((ratio) => <g key={ratio}><line x1={left} x2={width - 15} y1={baseline - ratio * plotHeight} y2={baseline - ratio * plotHeight} /><text x={left - 10} y={baseline - ratio * plotHeight + 4} textAnchor="end">{money(maximum * ratio, view.currency)}</text></g>)}
      {rows.map((row, index) => { const x = left + (index + .5) * slot; const revenueHeight = Math.max(0, Number(row.revenue) || 0) / maximum * plotHeight; const expenseHeight = Math.max(0, Number(row.expenses) || 0) / maximum * plotHeight; return <g key={row.month || index}><title>{row.month}: revenue {money(row.revenue, view.currency)}, expenses {money(row.expenses, view.currency)}</title><rect x={x - barWidth - 3} y={baseline - revenueHeight} width={barWidth} height={revenueHeight} rx="4" /><rect className="expenses" x={x + 3} y={baseline - expenseHeight} width={barWidth} height={expenseHeight} rx="4" /><text x={x} y={height - 10} textAnchor="middle">{row.month}</text></g>; })}
    </svg></div>;
  };

  const Donut = ({ revenue, expenses, currency }) => {
    const safeRev = Math.max(0, Number(revenue) || 0);
    const safeExp = Math.max(0, Number(expenses) || 0);
    const net = safeRev - safeExp;
    const total = Math.max(safeRev, safeExp);
    if (total <= 0) {
      return (
        <div className="cr-donut-wrap">
          <div className="cr-donut"><div className="cr-donut-hole"><span className="cr-donut-center">?</span></div></div>
          <div className="cr-donut-legend"><span>No revenue or expenses recorded</span></div>
        </div>
      );
    }
    const expPct = (safeExp / total) * 100;
    const expDeg = expPct * 3.6;
    const conic = `conic-gradient(from 0deg, #d4aaa4 0deg ${expDeg}deg, #9fc1b0 ${expDeg}deg 360deg)`;
    return (
      <div className="cr-donut-wrap">
        <div className="cr-donut" style={{ background: conic }}>
          <div className="cr-donut-hole"><span className="cr-donut-center">{expPct.toFixed(0)}%</span></div>
        </div>
        <div className="cr-donut-legend">
          <span><span className="swatch" style={{ background: "#d4aaa4" }} /> Expenses {money(safeExp, currency)}</span>
          <span><span className="swatch" style={{ background: "#9fc1b0" }} /> Net {money(net, currency)}</span>
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
              <span className="cr-h-track"><span className={`cr-h-fill ${cls}`} style={{ width: `${Math.max(0, pct)}%` }} /></span>
              <span className="cr-h-value">{money(it.value, view?.currency)}</span>
              {it.hours > 0 && <span className="cr-li-sub">{it.hours}h</span>}
            </li>
          );
        })}
      </ul>
    );
  };

  return view === null ? (
    <div className="cr-shell workspace-page" aria-busy={loading}>
      <Helmet><title>Deal ROI - Brandio</title></Helmet>
      <WorkspaceHeader eyebrow="Intelligence / Deal ROI" title="Deal ROI" description="Understand what your campaigns earn after the time and expenses you record." />
      {error ? <div className="ws-note" role="alert"><p>{error}</p><button onClick={() => setRetry((value) => value + 1)}>Try again</button></div> : <p role="status">Loading ROI data…</p>}
    </div>
  ) : !hasData ? (
    <div className="cr-shell workspace-page">
      <Helmet><title>Deal ROI - Brandio</title></Helmet>
      <WorkspaceHeader eyebrow="Intelligence / Deal ROI" title="Deal ROI" description="Understand what your campaigns earn after the time and expenses you record." />
      {data?.availableCurrencies?.length > 1 && <label>Currency <select aria-label="ROI currency" value={data.currency} onChange={(event) => setSelectedCurrency(event.target.value)}>{data.availableCurrencies.map((code) => <option key={code} value={code}>{code}</option>)}</select></label>}
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
    <div className="cr-shell workspace-page">
      <Helmet>
        <title>Deal ROI - Brandio</title>
        <meta name="description" content="Creator-side ROI for completed brand deals — net earnings, hourly rate, expenses and revenue over time." />
      </Helmet>

      <WorkspaceHeader eyebrow="Intelligence / Deal ROI" title="Deal ROI" description="Understand what your campaigns earn after the time and expenses you record." />
      {data?.availableCurrencies?.length > 1 && <label>Currency <select aria-label="ROI currency" value={data.currency} onChange={(event) => setSelectedCurrency(event.target.value)}>{data.availableCurrencies.map((code) => <option key={code} value={code}>{code}</option>)}</select></label>}
      <WorkspaceStats items={[
        { label: "Net earnings", value: money(view.net, view.currency), note: `${view.tracked} tracked deals`, icon: "money" },
        { label: "Expenses", value: money(view.expenses, view.currency), note: "Recorded campaign costs", icon: "file", tone: "amber" },
        { label: "Hours invested", value: view.hours > 0 ? `${view.hours}h` : "—", note: "Creator-entered time", icon: "clock", tone: "blue" },
        { label: "Average hourly", value: view.hourly !== null && Number.isFinite(view.hourly) ? money(view.hourly, view.currency) + "/h" : "—", note: "Only deals with hours logged", icon: "chart", tone: "green" }
      ]} />

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
          {view.hourly !== null && Number.isFinite(view.hourly) ? (
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
          <p className="cr-section-sub">Completed deals with recorded earnings will appear here.</p>
        ) : (
          <div className="cr-table-wrap">
            <table className="cr-table">
              <thead>
                <tr><th>Deal</th><th>Brand</th><th>Platform</th><th style={{ textAlign: "right" }}>Revenue</th><th style={{ textAlign: "right" }}>Expenses</th><th style={{ textAlign: "right" }}>Net</th></tr>
              </thead>
              <tbody>
                {view.top.map((d) => { const roi = d.roi || computeDealRoi(d); return (
                  <tr key={d.id}>
                    <td className="cr-table-name">{d.title || `${d.brand_name || "Deal"} #${d.id}`}<small>{d.roi_notes ? d.roi_notes.slice(0, 48) : ""}</small></td>
                    <td>{d.brand_name || "—"}</td>
                    <td>{d.platform_custom || d.platform || "—"}</td>
                    <td className="cr-table-amount" style={{ textAlign: "right" }}>{money(roi.revenue, d.currency)}</td>
                    <td style={{ textAlign: "right" }}>{money(roi.expenses, d.currency)}</td>
                    <td className="cr-table-amount" style={{ textAlign: "right" }}>{money(roi.net, d.currency)}</td>
                  </tr>
                ); })}
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
