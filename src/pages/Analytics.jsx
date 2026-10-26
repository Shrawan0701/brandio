import { useEffect, useState } from "react";
import { fetchAnalytics, exportAnalyticsCSV } from "../lib/api";
import { formatMoney } from "../utils/deals";


export default function Analytics() {
  const [data, setData] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState(null);


  useEffect(() => {
    fetchAnalytics(selectedCurrency).then(res => setData(res.data));
  }, [selectedCurrency]);

  if (!data) return <div className="text-muted">Loading analytics…</div>;

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4">Analytics</h2>
      {data.availableCurrencies?.length > 1 && <label>Currency <select aria-label="Analytics currency" value={data.currency} onChange={(event) => setSelectedCurrency(event.target.value)}>{data.availableCurrencies.map((code) => <option key={code} value={code}>{code}</option>)}</select></label>}

      <div className="row g-4 mb-4">
        <Stat title="This Month" value={formatMoney(data.thisMonth, data.currency)} />
<Stat title="Pending Amount" value={formatMoney(data.pendingAmount, data.currency)} />
<Stat title="Total Earned" value={formatMoney(data.totalEarned, data.currency)} />

      </div>

      <div className="card p-4">
        <h5 className="fw-semibold mb-3">Deal Summary</h5>

       <div className="deal-summary-grid mb-4">
  <Summary label="Total Deals" value={data.counts.total_deals} />
  <Summary label="Completed" value={data.counts.completed} />
  <Summary label="Pending" value={data.counts.pending} />
</div>


       <div className="export-btn-wrapper">
  <button
    className="btn btn-dark export-btn"
    onClick={exportAnalyticsCSV}
  >
    EXPORT CSV
  </button>
</div>

      </div>
    </div>
  );
}

function Stat({ title, value }) {
  return (
    <div className="col-md-4">
      <div className="analytics-card">
        <div className="text-muted small">{title}</div>
        <div className="fs-3 fw-bold">{value}</div>
      </div>
    </div>
  );
}

function Summary({ label, value }) {
  return (
    <div>
      <div className="fw-bold">{value}</div>
      <div className="text-muted small">{label}</div>
    </div>
  );
}
