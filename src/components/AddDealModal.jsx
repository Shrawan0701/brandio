import { useState } from "react";
import api from "../lib/api";

export default function AddDealModal({ onClose, onCreated, totalDeals, plan }) {
  /* HARD BLOCK — FREE PLAN */
  if (plan === "free" && totalDeals >= 5) {
    return (
      <ModalShell onClose={onClose}>
        <h5 className="fw-bold mb-2">Free plan limit reached 🚫</h5>
        <p className="text-muted mb-3">
          You’ve used all 5 free deals.  
          Upgrade to Pro to add unlimited deals.
        </p>
        <button className="btn btn-warning w-100 fw-semibold">
          Upgrade to Pro
        </button>
      </ModalShell>
    );
  }

  /* FORM STATE */
  const [form, setForm] = useState({
    brand_name: "",
    platform: "Instagram",
    platform_custom: "",
    amount: "",
    currency: "₹",
    status: "pending",
    posting_date: "",
    payment_due_date: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/deals", {
        ...form,
        amount: Number(form.amount)
      });
      onCreated(res.data);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to create deal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell onClose={onClose}>
      <h5 className="fw-bold mb-3">Add Brand Deal</h5>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Brand */}
      <input
        className="form-control mb-2"
        placeholder="Brand name"
        value={form.brand_name}
        onChange={(e) => update("brand_name", e.target.value)}
      />

      {/* Platform */}
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

      {/* Custom platform */}
      {form.platform === "Other" && (
        <input
          className="form-control mb-2"
          placeholder="Custom platform"
          value={form.platform_custom}
          onChange={(e) => update("platform_custom", e.target.value)}
        />
      )}

      {/* Amount */}
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
          placeholder="Amount"
          value={form.amount}
          onChange={(e) => update("amount", e.target.value)}
        />
      </div>

      {/* Status */}
      <select
        className="form-select mb-2"
        value={form.status}
        onChange={(e) => update("status", e.target.value)}
      >
        <option value="pending">Pending</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
      </select>

      {/* Posting date */}
      <div className="mb-2">
        <label className="form-label small text-muted">
          Posting date 
        </label>
        <input
          type="date"
          className="form-control"
          value={form.posting_date}
          onChange={(e) => update("posting_date", e.target.value)}
        />
      </div>

      {/* Payment due date */}
      <div className="mb-3">
        <label className="form-label small text-muted">
          Payment due date 
        </label>
        <input
          type="date"
          className="form-control"
          value={form.payment_due_date}
          onChange={(e) => update("payment_due_date", e.target.value)}
        />
      </div>

      {/* Submit */}
      <button
        className="btn btn-dark w-100 fw-semibold"
        onClick={submit}
        disabled={loading}
      >
        {loading ? "Saving..." : "Create Deal"}
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
