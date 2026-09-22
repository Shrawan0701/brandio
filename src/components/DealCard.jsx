import { useState } from "react";
import { Link } from "react-router-dom";
import EditDealModal from "./EditDealModal";
import DealContractSection from "./DealContractSection";
import DealRoiSection from "./DealRoiSection";
import { createPortfolioItem, deleteDeal } from "../lib/api";
import DealImageUpload from "./DealImageUpload";
import { useToast } from "./ToastProvider";
import {
  cashRevenue,
  commissionRevenue,
  formatMoney,
  getDealType,
  getDealTypeMeta,
  isCommissionDeal,
  isProductDeal,
  productValue,
  totalEarned
} from "../utils/deals";

export default function DealCard({ deal, onDeleted, onUpdated }) {
  const { showToast } = useToast();
  const dealTypeMeta = getDealTypeMeta(getDealType(deal));
  const [showEdit, setShowEdit] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [showRoi, setShowRoi] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [inPortfolio, setInPortfolio] = useState(false);
  const [addingToPortfolio, setAddingToPortfolio] = useState(false);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteDeal(deal.id);
      onDeleted(deal.id);
    } catch {
      alert("Failed to delete deal");
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleAddToPortfolio = async () => {
    try {
      setAddingToPortfolio(true);
      await createPortfolioItem({ deal_id: deal.id });
      setInPortfolio(true);
      showToast("Added to your portfolio", "success");
    } catch (err) {
      const message = err.response?.data?.message || "Could not add to portfolio";
      if (err.response?.status === 409) setInPortfolio(true);
      showToast(message, "error");
    } finally {
      setAddingToPortfolio(false);
    }
  };

  const value = isProductDeal(deal)
    ? formatMoney(productValue(deal), deal.currency)
    : formatMoney(totalEarned(deal), deal.currency);
  const hasDates = Boolean(deal.posting_date || deal.payment_due_date || deal.received_date || deal.expected_content_date);

  return (
    <>
      <article className="deal-card-v2">
        <div className="deal-card-summary">
        <div className="deal-card-head">
          <div>
            <h3>{deal.brand_name}</h3>
            <p>{deal.platform || deal.platform_custom || "Campaign"}</p>
          </div>
          <span className={`deal-status-pill ${deal.status || ""}`}>{deal.status}</span>
        </div>

        <div className="deal-card-value">
          <span>{dealTypeMeta.label}</span>
          <strong>{value}</strong>
          <small>{isProductDeal(deal) ? "Product value, not cash revenue" : "Total earned"}</small>
        </div>

        {isCommissionDeal(deal) && (
          <div className="deal-money-breakdown">
            <span>Cash {formatMoney(cashRevenue(deal), deal.currency)}</span>
            <span>Commission {formatMoney(commissionRevenue(deal), deal.currency)}</span>
            {Number(deal.commission_percentage) > 0 && <span>{deal.commission_percentage}% rate</span>}
          </div>
        )}

        {isProductDeal(deal) && (
          <div className="deal-product-box">
            {deal.product_name && <div><strong>Product:</strong> {deal.product_name}</div>}
            {deal.deliverables && <div><strong>Deliverables:</strong> {deal.deliverables}</div>}
            {deal.shipping_tracking && <div><strong>Shipping:</strong> {deal.shipping_tracking}</div>}
          </div>
        )}

        {deal.proof_images?.length > 0 && (
          <div className="deal-proof-strip">
            {deal.proof_images.map((img, i) => (
              <img key={i} src={img} alt="Deal proof" className="deal-proof-image" onClick={() => window.open(img, "_blank")} />
            ))}
          </div>
        )}

        <DealImageUpload deal={deal} onUpdated={onUpdated} />

        {hasDates && (
          <div className="deal-date-grid">
            <DateItem label="Posting" value={deal.posting_date} />
            <DateItem label="Due" value={deal.payment_due_date} />
            <DateItem label="Received" value={deal.received_date} />
            <DateItem label="Content" value={deal.expected_content_date} />
          </div>
        )}

        {deal.status === "completed" && (
          <button className="deal-portfolio-btn" disabled={inPortfolio || addingToPortfolio} onClick={handleAddToPortfolio}>
            {inPortfolio ? "In portfolio" : addingToPortfolio ? "Adding..." : "Add to portfolio"}
          </button>
        )}

        <div className="deal-action-row">
          <button onClick={() => setShowEdit(true)}>Edit</button>
          <Link className="primary" to={`/deals/${deal.id}`}>Open</Link>
          <button onClick={() => setShowContract((v) => !v)}>{showContract ? "Hide contract" : "Contract"}</button>
          <button onClick={() => setShowRoi(true)}>Deal ROI</button>
          <button className="danger" onClick={() => setShowConfirm(true)}>Delete</button>
        </div>
        </div>

        {showContract && <div className="deal-card-expanded"><DealContractSection deal={deal} /></div>}
      </article>

      {showEdit && <EditDealModal deal={deal} onClose={() => setShowEdit(false)} onUpdated={onUpdated} />}
      {showRoi && (
        <div className="deal-roi-modal-backdrop" role="dialog" aria-modal="true" aria-label="Deal ROI">
          <div className="deal-roi-modal-card">
            <div className="deal-roi-modal-head">
              <div>
                <span>{deal.brand_name}</span>
                <h2>Deal ROI</h2>
              </div>
              <button type="button" onClick={() => setShowRoi(false)} aria-label="Close ROI">x</button>
            </div>
            <DealRoiSection deal={deal} onUpdated={onUpdated} />
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.55)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-0 pb-0">
                <h5 className="fw-bold text-danger mb-0">Delete Deal</h5>
              </div>
              <div className="modal-body pt-2">
                <div className="p-3 rounded-3 bg-light">
                  <p className="mb-1 fw-semibold">{deal.brand_name}</p>
                  <p className="text-muted mb-2">{deal.currency} {deal.amount}</p>
                  <p className="text-danger small mb-0">This action cannot be undone.</p>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button className="btn btn-light" onClick={() => setShowConfirm(false)}>Cancel</button>
                <button className="btn btn-danger px-4" disabled={deleting} onClick={handleDelete}>
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DateItem({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <span>{label}</span>
      <strong>{new Date(value).toLocaleDateString()}</strong>
    </div>
  );
}
