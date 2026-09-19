import { useState } from "react";
import api from "../lib/api";
import { DEAL_TYPES, isCommissionDeal, isProductDeal, num } from "../utils/deals";

function toInputDate(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function EditDealModal({ deal, onClose, onUpdated }) {
  const [form, setForm] = useState({
    brand_name: deal.brand_name || "",
    platform: deal.platform || "Instagram",
    platform_custom: deal.platform_custom || "",
    deal_type: deal.deal_type || "paid",
    amount: deal.amount ?? "",
    currency: deal.currency || "₹",
    status: deal.status || "pending",
    posting_date: toInputDate(deal.posting_date),
    payment_due_date: toInputDate(deal.payment_due_date),
    product_name: deal.product_name || "",
    product_value: deal.product_value ?? "",
    received_date: toInputDate(deal.received_date),
    deliverables: deal.deliverables || "",
    expected_content_date: toInputDate(deal.expected_content_date),
    shipping_tracking: deal.shipping_tracking || "",
    notes: deal.notes || "",
    fixed_amount: deal.fixed_amount ?? deal.amount ?? "",
    commission_percentage: deal.commission_percentage ?? "",
    commission_earned: deal.commission_earned ?? ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    setLoading(true);
    setError("");

    const productDeal = isProductDeal(form.deal_type);
    const commissionDeal = isCommissionDeal(form.deal_type);
    const fixedAmount = form.deal_type === "paid" ? num(form.amount) : num(form.fixed_amount);
    const commissionEarned = commissionDeal ? num(form.commission_earned) : 0;
    const totalEarned =
      form.deal_type === "hybrid"
        ? fixedAmount + commissionEarned
        : commissionDeal
        ? commissionEarned
        : form.deal_type === "paid"
        ? num(form.amount)
        : 0;

    try {
      const payload = {
        ...form,
        platform_custom: form.platform === "Other" ? form.platform_custom : null,
        amount: form.deal_type === "paid" ? num(form.amount) : fixedAmount,
        fixed_amount: fixedAmount,
        product_value: productDeal ? num(form.product_value) : 0,
        commission_percentage: commissionDeal ? num(form.commission_percentage) : 0,
        commission_earned: commissionEarned,
        total_earned: totalEarned
      };

      const res = await api.put(`/deals/${deal.id}`, payload);
      onUpdated(res.data);
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const productDeal = isProductDeal(form.deal_type);
  const commissionDeal = isCommissionDeal(form.deal_type);
  const showFixed = form.deal_type === "paid" || form.deal_type === "hybrid";

  return (
    <ModalShell onClose={onClose}>
      <h5 className="fw-bold mb-3">Edit Deal</h5>

      {error && <div className="alert alert-danger">{error}</div>}

      <DealTypeSelector value={form.deal_type} onChange={(value) => update("deal_type", value)} />

      <input className="form-control mb-2" value={form.brand_name} onChange={(e) => update("brand_name", e.target.value)} />

      <select className="form-select mb-2" value={form.platform} onChange={(e) => update("platform", e.target.value)}>
        <option>Instagram</option>
        <option>YouTube</option>
        <option>X</option>
        <option>Telegram</option>
        <option>Other</option>
      </select>

      {form.platform === "Other" && (
        <input className="form-control mb-2" placeholder="Custom platform" value={form.platform_custom} onChange={(e) => update("platform_custom", e.target.value)} />
      )}

      <MoneyRow form={form} update={update} amountKey={showFixed ? (form.deal_type === "paid" ? "amount" : "fixed_amount") : "amount"} placeholder={showFixed ? "Fixed cash amount" : "Cash amount, if any"} />

      {productDeal && <ProductFields form={form} update={update} />}
      {commissionDeal && <CommissionFields form={form} update={update} />}

      <select className="form-select mb-2" value={form.status} onChange={(e) => update("status", e.target.value)}>
        <option value="pending">Pending</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
      </select>

      <DateField label="Posting date" value={form.posting_date} onChange={(v) => update("posting_date", v)} />
      <DateField label={productDeal ? "Expected content date" : "Payment due date"} value={productDeal ? form.expected_content_date : form.payment_due_date} onChange={(v) => update(productDeal ? "expected_content_date" : "payment_due_date", v)} />

      <textarea className="form-control mb-3" rows="2" placeholder="Notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} />

      <button className="btn btn-dark w-100" onClick={submit} disabled={loading}>
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </ModalShell>
  );
}

function DealTypeSelector({ value, onChange }) {
  return (
    <div className="deal-type-grid mb-3">
      {DEAL_TYPES.map((type) => (
        <button key={type.value} type="button" className={`deal-type-option ${value === type.value ? "active" : ""}`} onClick={() => onChange(type.value)}>
          <span>{type.label}</span>
          <small>{type.hint}</small>
        </button>
      ))}
    </div>
  );
}

function MoneyRow({ form, update, amountKey, placeholder }) {
  return (
    <div className="d-flex gap-2 mb-2">
      <select className="form-select w-25" value={form.currency} onChange={(e) => update("currency", e.target.value)}>
        <option value="₹">₹ INR</option>
        <option value="$">$ USD</option>
      </select>
      <input type="number" className="form-control" placeholder={placeholder} value={form[amountKey]} onChange={(e) => update(amountKey, e.target.value)} />
    </div>
  );
}

function ProductFields({ form, update }) {
  return (
    <div className="deal-form-panel">
      <input className="form-control mb-2" placeholder="Product" value={form.product_name} onChange={(e) => update("product_name", e.target.value)} />
      <input type="number" className="form-control mb-2" placeholder="Product value (not cash revenue)" value={form.product_value} onChange={(e) => update("product_value", e.target.value)} />
      <DateField label="Received date" value={form.received_date} onChange={(v) => update("received_date", v)} />
      <textarea className="form-control mb-2" rows="2" placeholder="Deliverables" value={form.deliverables} onChange={(e) => update("deliverables", e.target.value)} />
      <input className="form-control mb-2" placeholder="Shipping or tracking information" value={form.shipping_tracking} onChange={(e) => update("shipping_tracking", e.target.value)} />
    </div>
  );
}

function CommissionFields({ form, update }) {
  const total = num(form.fixed_amount) + num(form.commission_earned);
  return (
    <div className="deal-form-panel">
      <div className="d-flex gap-2 mb-2">
        <input type="number" className="form-control" placeholder="Commission %" value={form.commission_percentage} onChange={(e) => update("commission_percentage", e.target.value)} />
        <input type="number" className="form-control" placeholder="Commission earned" value={form.commission_earned} onChange={(e) => update("commission_earned", e.target.value)} />
      </div>
      <div className="small text-muted">Total earned: {form.currency} {total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
    </div>
  );
}

function DateField({ label, value, onChange }) {
  return (
    <div className="mb-2">
      <label className="form-label small text-muted">{label}</label>
      <input type="date" className="form-control" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ModalShell({ children, onClose }) {
  return (
    <div className="modal-backdrop-custom">
      <div className="modal-card">
        <button className="modal-close" onClick={onClose}>x</button>
        {children}
      </div>
    </div>
  );
}
