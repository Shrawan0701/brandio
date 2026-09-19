import { useEffect, useMemo, useState } from "react";
import {
  createDeliverable,
  deleteDeliverable,
  fetchDealDeliverables,
  updateDeliverable
} from "../lib/api";
import { useToast } from "./ToastProvider";

export const STATUS_OPTIONS = [
  ["not_started", "Not started"],
  ["in_progress", "In progress"],
  ["submitted", "Submitted"],
  ["changes_requested", "Changes requested"],
  ["approved", "Approved"],
  ["published", "Published"],
  ["completed", "Completed"]
];

const doneStatuses = new Set(["approved", "published", "completed"]);

export default function DealDeliverablesSection({ dealId }) {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank());

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchDealDeliverables(dealId);
      setItems(data.deliverables || []);
    } catch {
      showToast("Could not load deliverables", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [dealId]);

  const progress = useMemo(() => {
    if (!items.length) return 0;
    const done = items.filter((item) => doneStatuses.has(item.status)).length;
    return Math.round((done / items.length) * 100);
  }, [items]);

  const save = async () => {
    try {
      const payload = { ...form, revision_count: Number(form.revision_count) || 0 };
      const saved = editing
        ? await updateDeliverable(editing.id, payload)
        : await createDeliverable(dealId, payload);
      setItems((prev) =>
        editing
          ? prev.map((item) => (item.id === saved.id ? saved : item))
          : [...prev, saved]
      );
      setEditing(null);
      setForm(blank());
      showToast(editing ? "Deliverable updated" : "Deliverable added", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Could not save deliverable", "error");
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Remove ${item.title}?`)) return;
    try {
      await deleteDeliverable(item.id);
      setItems((prev) => prev.filter((entry) => entry.id !== item.id));
      showToast("Deliverable removed", "success");
    } catch {
      showToast("Could not remove deliverable", "error");
    }
  };

  const edit = (item) => {
    setEditing(item);
    setForm({
      title: item.title || "",
      type: item.type || "",
      platform: item.platform || "",
      description: item.description || "",
      due_date: item.due_date || "",
      status: item.status || "not_started",
      submission_date: item.submission_date || "",
      approval_date: item.approval_date || "",
      content_url: item.content_url || "",
      notes: item.notes || "",
      revision_count: item.revision_count || 0
    });
  };

  return (
    <div className="del-section">
      <div className="del-head">
        <div>
          <h2>Deliverables</h2>
          <p>{items.length} connected deliverable{items.length === 1 ? "" : "s"}</p>
        </div>
        <div className="del-progress">
          <strong>{progress}%</strong>
          <span><i style={{ width: `${progress}%` }} /></span>
        </div>
      </div>

      {loading && <div className="del-empty">Loading deliverables...</div>}

      {!loading && (
        <>
          <div className="del-list">
            {items.map((item) => (
              <article className="del-item" key={item.id}>
                <div className={`del-check ${doneStatuses.has(item.status) ? "done" : ""}`}>{doneStatuses.has(item.status) ? "✓" : "○"}</div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.type || "Deliverable"} • {item.platform || "Platform"} • {statusLabel(item.status)}</p>
                  {item.description && <p className="del-desc">{item.description}</p>}
                  <div className="del-meta">
                    <span className={deadlineTone(item)}>{deadlineText(item)}</span>
                    {item.content_url && <a href={item.content_url} target="_blank" rel="noreferrer">Content</a>}
                    <span>{item.revision_count || 0} revisions</span>
                  </div>
                </div>
                <div className="del-actions">
                  <select value={item.status} onChange={(e) => updateDeliverable(item.id, { status: e.target.value }).then((updated) => setItems((prev) => prev.map((entry) => entry.id === updated.id ? updated : entry)))}>
                    {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <button onClick={() => edit(item)}>Edit</button>
                  <button onClick={() => remove(item)}>Remove</button>
                </div>
              </article>
            ))}
            {items.length === 0 && <div className="del-empty">No deliverables yet. Add the first one below.</div>}
          </div>

          <div className="del-form">
            <h3>{editing ? "Edit deliverable" : "Add deliverable"}</h3>
            <input placeholder="Title" value={form.title} onChange={(e) => set("title", e.target.value, setForm)} />
            <input placeholder="Type" value={form.type} onChange={(e) => set("type", e.target.value, setForm)} />
            <input placeholder="Platform" value={form.platform} onChange={(e) => set("platform", e.target.value, setForm)} />
            <input type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value, setForm)} />
            <select value={form.status} onChange={(e) => set("status", e.target.value, setForm)}>
              {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <input type="number" min="0" placeholder="Revision count" value={form.revision_count} onChange={(e) => set("revision_count", e.target.value, setForm)} />
            <input placeholder="Content URL" value={form.content_url} onChange={(e) => set("content_url", e.target.value, setForm)} />
            <textarea placeholder="Description / notes" value={form.description} onChange={(e) => set("description", e.target.value, setForm)} />
            <div>
              {editing && <button className="del-secondary" onClick={() => { setEditing(null); setForm(blank()); }}>Cancel</button>}
              <button onClick={save}>{editing ? "Save deliverable" : "Add deliverable"}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function blank() {
  return {
    title: "",
    type: "",
    platform: "",
    description: "",
    due_date: "",
    status: "not_started",
    submission_date: "",
    approval_date: "",
    content_url: "",
    notes: "",
    revision_count: 0
  };
}

function set(key, value, setter) {
  setter((prev) => ({ ...prev, [key]: value }));
}

export function statusLabel(status) {
  return STATUS_OPTIONS.find(([value]) => value === status)?.[1] || status;
}

function deadlineText(item) {
  if (!item.due_date) return "No due date";
  const today = new Date();
  const due = new Date(item.due_date);
  const diff = Math.ceil((due - today) / 86400000);
  if (doneStatuses.has(item.status)) return `Completed timeline: ${item.due_date}`;
  if (diff < 0) return `Overdue by ${Math.abs(diff)}d`;
  if (diff === 0) return "Due today";
  if (diff <= 7) return `Due in ${diff}d`;
  return `Due ${item.due_date}`;
}

function deadlineTone(item) {
  if (doneStatuses.has(item.status)) return "done";
  if (!item.due_date) return "";
  const diff = Math.ceil((new Date(item.due_date) - new Date()) / 86400000);
  if (diff < 0) return "overdue";
  if (diff <= 7) return "soon";
  return "";
}
