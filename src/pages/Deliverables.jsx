import { WorkspaceHeader, WorkspaceStats, WorkspaceIcon } from "../components/WorkspaceUI";
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
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchDeliverables();
      setItems(data.deliverables || []);
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

  const stats = useMemo(() => ({
    due_today: items.filter((item) => isToday(item.due_date)).length,
    due_this_week: items.filter((item) => daysUntil(item.due_date) >= 0 && daysUntil(item.due_date) < 7).length,
    overdue: items.filter((item) => daysUntil(item.due_date) < 0 && !isDone(item.status)).length,
    awaiting_approval: items.filter((item) => ["submitted", "changes_requested"].includes(item.status)).length,
    completed: items.filter((item) => isDone(item.status)).length
  }), [items]);

  const updateStatus = async (item, status) => {
    try {
      const updated = await updateDeliverable(item.id, { status });
      setItems((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
    } catch {
      showToast("Could not update deliverable", "error");
    }
  };

  return (
    <div className="del-page workspace-page">
      <Helmet><title>Deliverables - Brandio</title></Helmet>

      <WorkspaceHeader eyebrow="Main / Deliverables" title="Deliverables" description="Keep campaign assets, deadlines, and approvals moving forward." actions={<Link className="ws-button ws-secondary" to="/deals">Open deals <WorkspaceIcon name="arrow" /></Link>} />
      <WorkspaceStats items={[
        { label: "Due today", value: stats.due_today || 0, note: "On today’s schedule", icon: "calendar" },
        { label: "This week", value: stats.due_this_week || 0, note: "Upcoming deadlines", icon: "clock", tone: "blue" },
        { label: "Overdue", value: stats.overdue || 0, note: "Needs attention", icon: "alert", tone: "amber" },
        { label: "Awaiting approval", value: stats.awaiting_approval || 0, note: "With the brand", icon: "eye" },
        { label: "Completed", value: stats.completed || 0, note: "Approved or published", icon: "check", tone: "green" }
      ]} />

      <nav className="del-filters">
        {FILTERS.map(([id, label]) => (
          <button key={id} className={filter === id ? "active" : ""} aria-pressed={filter === id} onClick={() => setFilter(id)}>
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
                <p>{item.brand_name || "Untitled brand"} · {item.type || "Deliverable"} · {item.platform || "Platform"}</p>
                <div className="del-global-meta">
                  <span className={deadlineClass(item)}>{deadlineLabel(item)}</span>
                  <span>{statusLabel(item.status)}</span>
                  <span>{item.revision_count || 0} revisions</span>
                </div>
              </div>
              <div className="del-global-actions">
                <select aria-label={`Status for ${item.title}`} value={item.status} onChange={(e) => updateStatus(item, e.target.value)}>
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

function daysUntil(date) {
  if (!date) return 9999;
  const due = new Date(date);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((due - today) / 86400000);
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
  if (isDone(item.status)) return "Completed";
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
