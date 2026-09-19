import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { DEAL_TYPES, isCommissionDeal, isProductDeal, num } from "../utils/deals";

const baseForm = {
  brand_name: "",
  platform: "Instagram",
  platform_custom: "",
  deal_type: "paid",
  amount: "",
  currency: "₹",
  status: "pending",
  posting_date: "",
  payment_due_date: "",
  product_name: "",
  product_value: "",
  received_date: "",
  deliverables: "",
  expected_content_date: "",
  shipping_tracking: "",
  notes: "",
  fixed_amount: "",
  commission_percentage: "",
  commission_earned: ""
};

export default function AddDealModal({ onClose, onCreated, totalDeals, plan, initialData = {} }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...baseForm, ...initialData });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (plan === "free" && totalDeals >= 3) {
    return (
      <ModalShell onClose={onClose} title="Free plan limit reached">
        <div className="add-deal-paywall">
          <h3>Your 3 free deals are used.</h3>
          <p>Upgrade your plan to add more deals and keep tracking brand work without interruption.</p>
          <button onClick={() => navigate("/pricing")}>View plans</button>
        </div>
      </ModalShell>
    );
  }

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const productDeal = isProductDeal(form.deal_type);
  const commissionDeal = isCommissionDeal(form.deal_type);
  const showFixed = form.deal_type === "paid" || form.deal_type === "hybrid";

  const submit = async () => {
    setLoading(true);
    setError("");

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
      const res = await api.post("/deals", {
        ...form,
        platform_custom: form.platform === "Other" ? form.platform_custom : null,
        amount: form.deal_type === "paid" ? num(form.amount) : fixedAmount,
        fixed_amount: fixedAmount,
        product_value: productDeal ? num(form.product_value) : 0,
        commission_percentage: commissionDeal ? num(form.commission_percentage) : 0,
        commission_earned: commissionEarned,
        total_earned: totalEarned
      });
      onCreated(res.data);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to create deal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell onClose={onClose} title="Add Brand Deal">
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="add-deal-sections">
        <FormSection title="Deal">
          <DealTypeSelector value={form.deal_type} onChange={(value) => update("deal_type", value)} />
          <div className="add-deal-grid">
            <input className="form-control" placeholder="Brand name" value={form.brand_name} onChange={(e) => update("brand_name", e.target.value)} />
            <select className="form-select" value={form.platform} onChange={(e) => update("platform", e.target.value)}>
              <option>Instagram</option>
              <option>YouTube</option>
              <option>X</option>
              <option>Telegram</option>
              <option>Other</option>
            </select>
            {form.platform === "Other" && (
              <input className="form-control" placeholder="Custom platform" value={form.platform_custom} onChange={(e) => update("platform_custom", e.target.value)} />
            )}
            <select className="form-select" value={form.status} onChange={(e) => update("status", e.target.value)}>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </FormSection>

        <FormSection title="Value">
          <MoneyRow form={form} update={update} amountKey={showFixed ? (form.deal_type === "paid" ? "amount" : "fixed_amount") : "amount"} placeholder={showFixed ? "Fixed cash amount" : "Cash amount, if any"} />
          {productDeal && <ProductFields form={form} update={update} />}
          {commissionDeal && <CommissionFields form={form} update={update} />}
        </FormSection>

        <FormSection title="Delivery & Payment">
          <div className="add-deal-grid">
            <DateField label="Posting date" value={form.posting_date} onChange={(v) => update("posting_date", v)} />
            <DateField label={productDeal ? "Expected content date" : "Payment due date"} value={productDeal ? form.expected_content_date : form.payment_due_date} onChange={(v) => update(productDeal ? "expected_content_date" : "payment_due_date", v)} />
          </div>
          <textarea className="form-control" rows="2" placeholder="Notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
        </FormSection>
      </div>

      <div className="add-deal-footer">
        <button className="btn btn-light" onClick={onClose} disabled={loading}>Cancel</button>
        <button className="btn btn-dark fw-semibold" onClick={submit} disabled={loading}>
          {loading ? "Saving..." : "Create Deal"}
        </button>
      </div>
    </ModalShell>
  );
}

function DealTypeSelector({ value, onChange }) {
  return (
    <div className="deal-type-grid">
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
    <div className="add-money-row">
      <select className="form-select" value={form.currency} onChange={(e) => update("currency", e.target.value)}>
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
      <div className="add-deal-grid">
        <input className="form-control" placeholder="Product" value={form.product_name} onChange={(e) => update("product_name", e.target.value)} />
        <input type="number" className="form-control" placeholder="Product value (not cash revenue)" value={form.product_value} onChange={(e) => update("product_value", e.target.value)} />
        <DateField label="Received date" value={form.received_date} onChange={(v) => update("received_date", v)} />
        <input className="form-control" placeholder="Shipping or tracking information" value={form.shipping_tracking} onChange={(e) => update("shipping_tracking", e.target.value)} />
      </div>
      <textarea className="form-control mt-2" rows="2" placeholder="Deliverables" value={form.deliverables} onChange={(e) => update("deliverables", e.target.value)} />
    </div>
  );
}

function CommissionFields({ form, update }) {
  const total = num(form.fixed_amount) + num(form.commission_earned);
  return (
    <div className="deal-form-panel">
      <div className="add-deal-grid">
        <input type="number" className="form-control" placeholder="Commission %" value={form.commission_percentage} onChange={(e) => update("commission_percentage", e.target.value)} />
        <input type="number" className="form-control" placeholder="Commission earned" value={form.commission_earned} onChange={(e) => update("commission_earned", e.target.value)} />
      </div>
      <div className="small text-muted mt-2">Total earned: {form.currency} {total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
    </div>
  );
}

function DateField({ label, value, onChange }) {
  return (
    <div>
      <label className="form-label small text-muted">{label}</label>
      <input type="date" className="form-control" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function FormSection({ title, children }) {
  return (
    <section className="add-deal-section">
      <h6>{title}</h6>
      {children}
    </section>
  );
}

function ModalShell({ children, onClose, title }) {
  return (
    <div className="modal-backdrop-custom">
      <div className="modal-card add-deal-modal">
        <div className="add-deal-modal-head">
          <h5>{title}</h5>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>
        <div className="add-deal-modal-body">{children}</div>
      </div>
    </div>
  );
}
