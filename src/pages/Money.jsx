import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { fetchMoneyCockpit, updateMoneySettings } from "../lib/api";
import { formatMoney, num } from "../utils/deals";
import { useToast } from "../components/ToastProvider";

const dealTypeLabel = {
  paid: "Paid",
  gifted: "Gifted",
  barter: "Barter",
  affiliate: "Affiliate",
  commission: "Commission",
  hybrid: "Hybrid"
};

export default function Money() {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const next = await fetchMoneyCockpit();
      setData(next);
      setSettings(next.settings);
    } catch {
      setError("Could not load money cockpit");
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
    () => Math.max(1, ...(data?.expectedCashFlow || []).map((item) => num(item.expected))),
    [data]
  );

  const saveSettings = async () => {
    try {
      setSaving(true);
      await updateMoneySettings(settings);
      showToast("Money settings updated", "success");
      await load();
    } catch {
      showToast("Could not update money settings", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="money-page"><div className="money-empty">Loading money cockpit...</div></div>;
  if (error) return <div className="money-page"><div className="money-empty">{error}</div></div>;

  const s = data.summary;

  return (
    <div className="money-page">
      <Helmet><title>Money Cockpit - Brandio</title></Helmet>

      <header className="money-hero">
        <div>
          <span>Brandio Money Cockpit</span>
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
            <h2>Revenue chart</h2>
            <p>Actual recorded completed revenue by month.</p>
          </div>
          <div className="money-bars">
            {(data.revenueByMonth || []).map((item) => (
              <div className="money-bar" key={item.key}>
                <div className="money-bar-track">
                  <div style={{ height: `${Math.max(4, (num(item.revenue) / maxMonth) * 100)}%` }} />
                </div>
                <span>{item.label}</span>
                <strong>{formatMoney(item.revenue)}</strong>
              </div>
            ))}
            {!(data.revenueByMonth || []).length && <div className="money-empty-inline">No completed revenue yet.</div>}
          </div>
        </div>

        <div className="money-panel">
          <div className="money-panel-head">
            <h2>Expected cash flow</h2>
            <p>Open deal value grouped by due month.</p>
          </div>
          <div className="money-flow-list">
            {(data.expectedCashFlow || []).map((item) => (
              <div key={item.key}>
                <span>{item.label}</span>
                <div><i style={{ width: `${Math.max(4, (num(item.expected) / maxFlow) * 100)}%` }} /></div>
                <strong>{formatMoney(item.expected)}</strong>
              </div>
            ))}
            {!(data.expectedCashFlow || []).length && <div className="money-empty-inline">No dated expected cash flow yet.</div>}
          </div>
        </div>
      </section>

      <section className="money-grid-four">
        <Breakdown title="Revenue by brand" rows={data.revenueByBrand} labelKey="brand" />
        <Breakdown title="Revenue by platform" rows={data.revenueByPlatform} labelKey="platform" />
        <Breakdown title="Revenue by deal type" rows={data.revenueByDealType.map((r) => ({ ...r, deal_type: dealTypeLabel[r.deal_type] || r.deal_type }))} labelKey="deal_type" />
        <div className="money-panel money-settings">
          <h2>Planning reserve</h2>
          <label>Tax reserve percentage</label>
          <input
            type="number"
            value={settings.tax_reserve_percentage}
            onChange={(e) => setSettings({ ...settings, tax_reserve_percentage: e.target.value })}
          />
          <div className="money-reserve-line">
            <span>Basis</span><strong>{formatMoney(data.taxReserve.basis)}</strong>
          </div>
          <div className="money-reserve-line">
            <span>Suggested reserve</span><strong>{formatMoney(data.taxReserve.suggested_reserve)}</strong>
          </div>
          <p>Planning calculation only. Brandio does not provide tax advice.</p>
        </div>
      </section>

      <section className="money-panel money-foundation">
        <div className="money-panel-head">
          <h2>India finance foundation</h2>
          <p>Optional fields for future GST, PAN, TDS and invoice workflows.</p>
        </div>
        <div className="money-form-grid">
          <input placeholder="Business name" value={settings.business_name || ""} onChange={(e) => setSettings({ ...settings, business_name: e.target.value })} />
          <input placeholder="PAN / business identifier" value={settings.pan_number || ""} onChange={(e) => setSettings({ ...settings, pan_number: e.target.value })} />
          <input placeholder="GST information" value={settings.gst_number || ""} onChange={(e) => setSettings({ ...settings, gst_number: e.target.value })} />
          <input placeholder="Invoice prefix" value={settings.invoice_prefix || ""} onChange={(e) => setSettings({ ...settings, invoice_prefix: e.target.value })} />
          <label className="money-check">
            <input type="checkbox" checked={settings.tds_tracking_enabled === true} onChange={(e) => setSettings({ ...settings, tds_tracking_enabled: e.target.checked })} />
            Track TDS fields later
          </label>
        </div>
        <button disabled={saving} onClick={saveSettings}>{saving ? "Saving..." : "Save finance settings"}</button>
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

function Breakdown({ title, rows, labelKey }) {
  const max = Math.max(1, ...(rows || []).map((row) => num(row.revenue)));
  return (
    <div className="money-panel money-breakdown">
      <h2>{title}</h2>
      {(rows || []).map((row) => (
        <div className="money-break-row" key={row[labelKey] || "Unknown"}>
          <div>
            <span>{row[labelKey] || "Unknown"}</span>
            <strong>{formatMoney(row.revenue)}</strong>
          </div>
          <i><b style={{ width: `${Math.max(4, (num(row.revenue) / max) * 100)}%` }} /></i>
        </div>
      ))}
      {!(rows || []).length && <div className="money-empty-inline">No completed revenue yet.</div>}
    </div>
  );
}
