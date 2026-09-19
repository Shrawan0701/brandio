import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import {
  fetchBrandRelationships,
  fetchDeal,
  updateDeal
} from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ToastProvider";
import EditDealModal from "../components/EditDealModal";
import DealContractSection from "../components/DealContractSection";
import DealImageUpload from "../components/DealImageUpload";
import DealRoiSection from "../components/DealRoiSection";
import DealDeliverablesSection from "../components/DealDeliverablesSection";
import {
  formatMoney,
  getDealTypeMeta,
  totalEarned,
  productValue,
  isProductDeal,
  commissionRevenue,
  cashRevenue
} from "../utils/deals";

const statusTone = {
  pending: "pending",
  active: "active",
  completed: "completed",
  overdue: "overdue"
};

export default function DealWorkspace() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [deal, setDeal] = useState(null);
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchDeal(id);
        if (!alive) return;
        setDeal(data);
        setNote(data.notes || "");

        fetchBrandRelationships()
          .then((rel) => {
            const found = (rel.brands || []).find(
              (b) => b.brand?.toLowerCase() === data.brand_name?.toLowerCase()
            );
            if (alive) setBrand(found || null);
          })
          .catch(() => {});
      } catch {
        if (alive) setError("Could not load deal workspace");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const timeline = useMemo(() => buildTimeline(deal), [deal]);

  const health = useMemo(() => {
    if (!deal) return { label: "Unknown", tone: "neutral" };
    if (deal.status === "completed") return { label: "Completed", tone: "good" };
    if (deal.status === "overdue") return { label: "Payment overdue", tone: "risk" };
    if (deal.payment_due_date && new Date(deal.payment_due_date) < new Date()) {
      return { label: "Needs payment follow-up", tone: "risk" };
    }
    if (deal.status === "active") return { label: "In progress", tone: "active" };
    return { label: "Awaiting next step", tone: "neutral" };
  }, [deal]);

  const patchDeal = async (payload, message) => {
    try {
      setSaving(true);
      const updated = await updateDeal(deal.id, payload);
      setDeal(updated);
      setNote(updated.notes || "");
      showToast(message || "Deal updated", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Could not update deal", "error");
    } finally {
      setSaving(false);
    }
  };

  const saveNote = () => patchDeal({ notes: note }, "Note saved");

  if (loading) return <div className="dw-page"><div className="dw-empty">Loading deal workspace...</div></div>;
  if (error || !deal) return <div className="dw-page"><div className="dw-empty">{error || "Deal not found"}</div></div>;

  const dealType = getDealTypeMeta(deal.deal_type);
  const displayedValue = isProductDeal(deal) ? productValue(deal) : totalEarned(deal);

  return (
    <div className="dw-page">
      <Helmet><title>{deal.brand_name} Workspace - Brandio</title></Helmet>

      <header className="dw-header">
        <div>
          <Link to="/deals" className="dw-back">Back to deals</Link>
          <h1>{deal.brand_name}</h1>
          <p>{deal.product_name || deal.campaign_title || `${deal.platform} campaign`}</p>
          <div className="dw-header-meta">
            <span>{formatMoney(displayedValue, deal.currency)}</span>
            <span className={`dw-status ${statusTone[deal.status] || "pending"}`}>{deal.status}</span>
            <span className={`dw-health ${health.tone}`}>{health.label}</span>
          </div>
        </div>
        <div className="dw-header-actions">
          <button onClick={() => setEditing(true)}>Edit</button>
          <select value={deal.status} onChange={(e) => patchDeal({ status: e.target.value }, "Status updated")}>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </header>

      <main className="dw-grid">
        <section className="dw-panel dw-overview">
          <PanelHead title="Overview" action="Core deal details" />
          <div className="dw-facts">
            <Fact label="Deal value" value={formatMoney(displayedValue, deal.currency)} />
            <Fact label="Currency" value={deal.currency || "Not set"} />
            <Fact label="Deal type" value={dealType.label} />
            <Fact label="Platform" value={deal.platform_custom || deal.platform || "Not set"} />
            <Fact label="Brand contact" value={deal.brand_contact || "Not recorded"} />
            <Fact label="Created" value={formatDate(deal.created_at)} />
            <Fact label="Posting date" value={formatDate(deal.posting_date)} />
            <Fact label="Payment due" value={formatDate(deal.payment_due_date)} />
          </div>
        </section>

        <section className="dw-panel">
          <PanelHead title="Payment" action="Recorded values only" />
          <div className="dw-money">
            <Fact label="Cash revenue" value={formatMoney(cashRevenue(deal), deal.currency)} />
            <Fact label="Commission revenue" value={formatMoney(commissionRevenue(deal), deal.currency)} />
            <Fact label="Product value" value={formatMoney(productValue(deal), deal.currency)} />
            <Fact label="Paid date" value={formatDate(deal.paid_date)} />
          </div>
          <button className="dw-soft-btn" onClick={() => patchDeal({ status: "completed", paid_date: new Date().toISOString().slice(0, 10) }, "Marked paid")}>
            Mark paid
          </button>
        </section>

        <section className="dw-panel dw-wide">
          <DealDeliverablesSection dealId={deal.id} />
        </section>

        <section className="dw-panel">
          <PanelHead title="Timeline" action="Deal activity" />
          <div className="dw-timeline">
            {timeline.map((event) => (
              <div key={event.label}>
                <strong>{event.label}</strong>
                <span>{event.date}</span>
              </div>
            ))}
          </div>
          <button className="dw-soft-btn" onClick={() => patchDeal({ notes: `${note}\n\nFollow-up: ${new Date().toLocaleDateString()}`.trim() }, "Follow-up added")}>
            Add follow-up
          </button>
        </section>

        <section className="dw-panel dw-wide dw-contract">
          <DealContractSection deal={deal} />
        </section>

        <section className="dw-panel">
          <PanelHead title="Files" action="Campaign proof and assets" />
          <div className="dw-files">
            {(deal.proof_images || []).map((img, index) => (
              <img key={img} src={img} alt={`Campaign file ${index + 1}`} onClick={() => window.open(img, "_blank", "noopener")} />
            ))}
            {!(deal.proof_images || []).length && <p>No files uploaded yet.</p>}
          </div>
          {user?.plan === "pro" && <DealImageUpload deal={deal} onUpdated={setDeal} />}
        </section>

        <section className="dw-panel">
          <PanelHead title="Notes" action="Creator notes" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Private notes, clauses, next steps..." />
          <button className="dw-soft-btn" disabled={saving} onClick={saveNote}>Add note / Save</button>
        </section>

        <section className="dw-panel">
          <PanelHead title="Brand" action="Relationship intelligence" />
          {brand ? (
            <div className="dw-brand-box">
              <Fact label="Total collaborations" value={brand.total_deals} />
              <Fact label="Total revenue" value={formatMoney(brand.total_revenue, deal.currency)} />
              <Fact label="Avg payment timing" value={brand.average_payment_days === null ? "No data" : `${brand.average_payment_days} days`} />
              <Link to="/brands">Open Brand CRM</Link>
            </div>
          ) : (
            <p className="dw-muted">Brand relationship appears after recorded history is available.</p>
          )}
        </section>

        <section className="dw-panel">
          <PanelHead title="Performance" action="Campaign metrics" />
          <Fact label="Deliverables tracked" value={deal.deliverable_count || 0} />
          <Fact label="Revisions" value={deal.revision_count || 0} />
          <p className="dw-muted">Detailed campaign metrics can be added through portfolio and ROI tracking.</p>
        </section>

        <section className="dw-panel dw-wide">
          <DealRoiSection deal={deal} onUpdated={setDeal} />
        </section>
      </main>

      {editing && (
        <EditDealModal
          deal={deal}
          onClose={() => setEditing(false)}
          onUpdated={(updated) => {
            setDeal(updated);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}

function PanelHead({ title, action }) {
  return (
    <div className="dw-panel-head">
      <h2>{title}</h2>
      {action && <span>{action}</span>}
    </div>
  );
}

function Fact({ label, value }) {
  return (
    <div className="dw-fact">
      <span>{label}</span>
      <strong>{value || "Not recorded"}</strong>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "Not recorded";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function buildTimeline(deal) {
  if (!deal) return [];
  return [
    { label: "Deal created", date: formatDate(deal.created_at) },
    deal.posting_date && { label: "Posting date", date: formatDate(deal.posting_date) },
    deal.expected_content_date && { label: "Expected content", date: formatDate(deal.expected_content_date) },
    deal.payment_due_date && { label: "Payment due", date: formatDate(deal.payment_due_date) },
    deal.paid_date && { label: "Payment recorded", date: formatDate(deal.paid_date) },
    { label: `Current status: ${deal.status}`, date: "Now" }
  ].filter(Boolean);
}
