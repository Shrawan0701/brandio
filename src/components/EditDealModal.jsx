import { useState } from "react";
import api from "../lib/api";

/* ✅ SAFE date normalizer (NO timezone shift) */
function toInputDate(value) {
  if (!value) return "";

  // If already YYYY-MM-DD, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const d = new Date(value);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function EditDealModal({ deal, onClose, onUpdated }) {
  const [form, setForm] = useState({
    brand_name: deal.brand_name,
    platform: deal.platform,
    platform_custom: deal.platform_custom || "",
    amount: deal.amount,
    currency: deal.currency,
    status: deal.status,

    // ✅ FIXED (NO slice, NO timezone bug)
    posting_date: toInputDate(deal.posting_date),
    payment_due_date: toInputDate(deal.payment_due_date)
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    setLoading(true);
    setError("");

    try {
      const payload = {
        brand_name: form.brand_name,
        platform: form.platform,
        platform_custom:
          form.platform === "Other" ? form.platform_custom : null,
        currency: form.currency,
        amount: Number(form.amount),
        status: form.status
      };

      // ✅ send dates ONLY if present
      if (form.posting_date)
        payload.posting_date = form.posting_date;
      if (form.payment_due_date)
        payload.payment_due_date = form.payment_due_date;

      const res = await api.put(`/deals/${deal.id}`, payload);

      onUpdated(res.data);
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell onClose={onClose}>
      <h5 className="fw-bold mb-3">Edit Deal</h5>

      {error && <div className="alert alert-danger">{error}</div>}

      <input
        className="form-control mb-2"
        value={form.brand_name}
        onChange={(e) => update("brand_name", e.target.value)}
      />

      <select
        className="form-select mb-2"
        value={form.platform}
        onChange={(e) => update("platform", e.target.value)}
      >
        <option>Instagram</option>
        <option>YouTube</option>
        <option>X</option>
        <option>Telegram</option>
        <option>Other</option>
      </select>

      {form.platform === "Other" && (
        <input
          className="form-control mb-2"
          placeholder="Custom platform"
          value={form.platform_custom}
          onChange={(e) =>
            update("platform_custom", e.target.value)
          }
        />
      )}

      <div className="d-flex gap-2 mb-2">
        <select
          className="form-select w-25"
          value={form.currency}
          onChange={(e) => update("currency", e.target.value)}
        >
          <option value="₹">₹ INR</option>
          <option value="$">$ USD</option>
        </select>

        <input
          type="number"
          className="form-control"
          value={form.amount}
          onChange={(e) => update("amount", e.target.value)}
        />
      </div>

      <select
        className="form-select mb-2"
        value={form.status}
        onChange={(e) => update("status", e.target.value)}
      >
        <option value="pending">Pending</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
      </select>

      <label className="form-label small text-muted">
        Posting date
      </label>
      <input
        type="date"
        className="form-control mb-2"
        value={form.posting_date}
        onChange={(e) =>
          update("posting_date", e.target.value)
        }
      />

      <label className="form-label small text-muted">
        Payment due date
      </label>
      <input
        type="date"
        className="form-control mb-3"
        value={form.payment_due_date}
        onChange={(e) =>
          update("payment_due_date", e.target.value)
        }
      />

      <button
        className="btn btn-dark w-100"
        onClick={submit}
        disabled={loading}
      >
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </ModalShell>
  );
}

/* Modal shell */
function ModalShell({ children, onClose }) {
  return (
    <div className="modal-backdrop-custom">
      <div className="modal-card">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
