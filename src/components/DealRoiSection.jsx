import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useToast } from "./ToastProvider";
import api from "../lib/api";
import { computeDealRoi, money, moneyPerHour, fmtDays } from "../utils/roi";

export default function DealRoiSection({ deal, onUpdated }) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    hours_spent: deal.hours_spent ?? "",
    revision_count: deal.revision_count ?? 0,
    deliverable_count: deal.deliverable_count ?? 0,
    expenses: deal.expenses ?? 0,
    paid_date: deal.paid_date ? String(deal.paid_date).slice(0, 10) : "",
    roi_notes: deal.roi_notes ?? ""
  });

  const roi = computeDealRoi(deal);
  const isCompleted = deal.status === "completed";
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    try {
      setSaving(true);
      const payload = {
        hours_spent: form.hours_spent === "" ? null : Number(form.hours_spent),
        revision_count: Number(form.revision_count) || 0,
        deliverable_count: Number(form.deliverable_count) || 0,
        expenses: form.expenses === "" ? 0 : Number(form.expenses),
        roi_notes: form.roi_notes?.trim() ? form.roi_notes.trim() : null
      };
      if (form.paid_date) payload.paid_date = form.paid_date;
      const res = await api.put(`/deals/${deal.id}`, payload);
      onUpdated?.(res.data);
      setEditing(false);
      showToast("ROI details saved");
    } catch {
      showToast("Could not save ROI details", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!isCompleted) {
    return (
      <div className="cr-section">
        <div className="cr-section-head">
          <div>
            <h3 className="cr-section-title">Deal ROI</h3>
            <p className="cr-section-sub">
              ROI estimates are available once a deal is marked completed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cr-section">
      <Helmet>
        <title>Deal ROI - Brandio</title>
      </Helmet>

      <div className="cr-section-head">
        <div>
          <h3 className="cr-section-title">
            Deal ROI<span style={{ display: "block" }}>
              <span className="cr-section-sub" style={{ color: "var(--cr-ink-faint)" }}>
                Creator-side economics for this campaign
              </span>
            </span>
          </h3>
        </div>
        <button className="cr-btn" onClick={() => setEditing(true)}>
          {roi.hasEnoughData ? "Edit details" : "Log effort"}
        </button>
      </div>

      <div className="cr-grid">
        <div className="cr-card">
          <div className="cr-card-head">
            <div>
              <div className="cr-card-label">Revenue</div>
              <div className="cr-card-value">{money(roi.revenue, deal.currency)}</div>
            </div>
          </div>
        </div>
        <div className="cr-card">
          <div className="cr-card-head">
            <div>
              <div className="cr-card-label">Expenses</div>
              <div className="cr-card-value">{money(roi.expenses, deal.currency)}</div>
            </div>
          </div>
        </div>
        <div className="cr-card">
          <div className="cr-card-head">
            <div>
              <div className="cr-card-label">Net</div>
              <div className={`cr-card-value ${roi.net >= 0 ? "cr-card-positive" : "cr-card-negative"}`}>
                {money(roi.net, deal.currency)}
              </div>
            </div>
          </div>
        </div>
        <div className="cr-card">
          <div className="cr-card-head">
            <div>
              <div className="cr-card-label">Time invested</div>
              <div className="cr-card-value">{roi.hours ? `${roi.hours}h` : "—"}</div>
            </div>
          </div>
        </div>
        <div className="cr-card">
          <div className="cr-card-head">
            <div>
              <div className="cr-card-label">Effective hourly</div>
                            <div className="cr-card-value">{moneyPerHour(roi.hourly, deal.currency)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="cr-row" style={{ marginTop: 12 }}>
        <div className="cr-card">
          <div className="cr-card-head">
            <div>
              <div className="cr-card-label">Deliverables</div>
              <div className="cr-card-value">{roi.deliverables}</div>
            </div>
          </div>
        </div>
        <div className="cr-card">
          <div className="cr-card-head">
            <div>
              <div className="cr-card-label">Revisions</div>
              <div className="cr-card-value">{roi.revisions}</div>
            </div>
          </div>
        </div>
        <div className="cr-card">
          <div className="cr-card-head">
            <div>
              <div className="cr-card-label">Payment waiting time</div>
              <div className="cr-card-value">{fmtDays(roi.waitDays)}</div>
            </div>
            <div className="cr-card-note">posting_date → paid_date</div>
          </div>
        </div>
        <div className="cr-card">
          <div className="cr-card-head">
            <div>
              <div className="cr-card-label">Campaign duration</div>
              <div className="cr-card-value">{fmtDays(roi.durationDays)}</div>
            </div>
            <div className="cr-card-note">posting_date → payment_due_date</div>
          </div>
        </div>
      </div>

      {editing && (
        <div className="cr-overlay">
          <div className="cr-modal">
            <h3 className="cr-modal-title">Log effort for this deal</h3>
            <p className="cr-modal-sub">
              Enter the time and expenses you invested so this deal's ROI is
              accurate.
            </p>

            <div className="cr-row-inputs">
              <div className="cr-col">
                <label className="cr-label">Hours spent</label>
                <input
                  className="cr-input"
                  type="number"
                  step="0.25"
                  min="0"
                  value={form.hours_spent}
                  onChange={(e) => set("hours_spent", e.target.value)}
                />
              </div>
              <div className="cr-col">
                <label className="cr-label">Expenses</label>
                <input
                  className="cr-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.expenses}
                  onChange={(e) => set("expenses", e.target.value)}
                />
              </div>
            </div>

            <label className="cr-label">Deliverable count</label>
            <input
              className="cr-input"
              type="number"
              min="0"
              value={form.deliverable_count}
              onChange={(e) => set("deliverable_count", e.target.value)}
            />

            <label className="cr-label">Revision count</label>
            <input
              className="cr-input"
              type="number"
              min="0"
              value={form.revision_count}
              onChange={(e) => set("revision_count", e.target.value)}
            />

            <label className="cr-label">Paid date</label>
            <input
              className="cr-input"
              type="date"
              value={form.paid_date}
              onChange={(e) => set("paid_date", e.target.value)}
            />

            <label className="cr-label">Notes</label>
            <textarea
              className="cr-input cr-textarea"
              rows={3}
              value={form.roi_notes}
              onChange={(e) => set("roi_notes", e.target.value)}
            />

            <div className="cr-modal-actions">
              <button className="cr-btn" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button className="cr-btn cr-btn-primary" disabled={saving} onClick={save}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="cr-fineprint" style={{ marginTop: 12 }}>
        Net = revenue minus creator-side expenses. Hourly rate = net ÷ hours
        spent. Only your entered values are used — nothing is fabricated.
      </p>
    </div>
  );
}

