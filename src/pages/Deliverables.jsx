import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { fetchDeliverables, updateDeliverable } from "../lib/api";
import { STATUS_OPTIONS, statusLabel } from "../components/DealDeliverablesSection";
import { useToast } from "../components/ToastProvider";

const FILTERS = [
  ["all", "All"],
  ["today", "Due today"],
  ["week", "Due this week"],
  ["overdue", "Overdue"],
  ["awaiting_approval", "Awaiting approval"],
  ["completed", "Completed"]
];

export default function Deliverables() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchDeliverables();
      setItems(data.deliverables || []);
      setStats(data.stats || {});
    } catch {
      setError("Could not load deliverables");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "today") return items.filter((item) => isToday(item.due_date));
    if (filter === "week") return items.filter((item) => daysUntil(item.due_date) >= 0 && daysUntil(item.due_date) < 7);
    if (filter === "overdue") return items.filter((item) => daysUntil(item.due_date) < 0 && !isDone(item.status));
    if (filter === "awaiting_approval") return items.filter((item) => ["submitted", "changes_requested"].includes(item.status));
    if (filter === "completed") return items.filter((item) => isDone(item.status));
    return items;
  }, [filter, items]);

  const updateStatus = async (item, status) => {
    try {
      const updated = await updateDeliverable(item.id, { status });
      setItems((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
    } catch {
      showToast("Could not update deliverable", "error");
    }
  };

  return (
    <div className="del-page">
      <Helmet><title>Deliverables - Brandio</title></Helmet>

      <header className="del-page-hero">
        <div>
          <span>Deliverable Management</span>
          <h1>Every campaign asset, deadline and approval in one place.</h1>
          <p>Normalized deliverables connected to your Brandio deals.</p>
        </div>
        <div className="del-stat-grid">
          <Stat label="Due today" value={stats.due_today || 0} />
          <Stat label="Due this week" value={stats.due_this_week || 0} />
          <Stat label="Overdue" value={stats.overdue || 0} />
          <Stat label="Awaiting approval" value={stats.awaiting_approval || 0} />
          <Stat label="Completed" value={stats.completed || 0} />
        </div>
      </header>

      <nav className="del-filters">
        {FILTERS.map(([id, label]) => (
          <button key={id} className={filter === id ? "active" : ""} onClick={() => setFilter(id)}>
            {label}
          </button>
        ))}
      </nav>

      {loading && <div className="del-empty-page">Loading deliverables...</div>}
      {error && <div className="del-empty-page">{error}</div>}
      {!loading && !error && visible.length === 0 && <div className="del-empty-page">No deliverables in this view.</div>}

      {!loading && !error && visible.length > 0 && (
        <section className="del-page-list">
          {visible.map((item) => (
            <article className="del-global-card" key={item.id}>
              <div>
                <h3>{item.title}</h3>
                <p>{item.brand_name} • {item.type || "Deliverable"} • {item.platform || "Platform"}</p>
                <div className="del-global-meta">
                  <span className={deadlineClass(item)}>{deadlineLabel(item)}</span>
                  <span>{statusLabel(item.status)}</span>
                  <span>{item.revision_count || 0} revisions</span>
                </div>
              </div>
              <div className="del-global-actions">
                <select value={item.status} onChange={(e) => updateStatus(item, e.target.value)}>
                  {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <Link to={`/deals/${item.deal_id}`}>Open deal</Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return <div><strong>{value}</strong><span>{label}</span></div>;
}

function daysUntil(date) {
  if (!date) return 9999;
  return Math.ceil((new Date(date) - new Date()) / 86400000);
}

function isToday(date) {
  if (!date) return false;
  return new Date(date).toDateString() === new Date().toDateString();
}

function isDone(status) {
  return ["approved", "published", "completed"].includes(status);
}

function deadlineLabel(item) {
  if (!item.due_date) return "No due date";
  const diff = daysUntil(item.due_date);
  if (isDone(item.status)) return `Completed track`;
  if (diff < 0) return `Overdue by ${Math.abs(diff)}d`;
  if (diff === 0) return "Due today";
  if (diff < 7) return `Due in ${diff}d`;
  return `Due ${item.due_date}`;
}

function deadlineClass(item) {
  if (isDone(item.status)) return "done";
  const diff = daysUntil(item.due_date);
  if (diff < 0) return "overdue";
  if (diff < 7) return "soon";
  return "";
}
