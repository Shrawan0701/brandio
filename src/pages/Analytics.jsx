import { useEffect, useState } from "react";
import { fetchAnalytics, exportAnalyticsCSV } from "../lib/api";

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchAnalytics().then(res => setData(res.data));
  }, []);

  if (!data) return <div className="text-muted">Loading analytics…</div>;

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4">Analytics</h2>

      <div className="row g-4 mb-4">
        <Stat title="This Month" value={`₹${data.thisMonth}`} />
        <Stat title="Pending Amount" value={`₹${data.pendingAmount}`} />
        <Stat title="Total Earned" value={`₹${data.totalEarned}`} />
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
