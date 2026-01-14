import { useState } from "react";
import EditDealModal from "./EditDealModal";
import { useAuth } from "../context/AuthContext";
import { deleteDeal } from "../lib/api";
import DealImageUpload from "./DealImageUpload";


export default function DealCard({ deal, onDeleted, onUpdated }) {
  const { user } = useAuth();

  const [showEdit, setShowEdit] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const statusColor = {
    pending: "secondary",
    active: "primary",
    completed: "success",
    overdue: "danger",
  };

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

  return (
    <>
   
      {/* DEAL CARD */}
      <div
        className="card h-100"
        style={{
          border: "1.5px solid #c3c5c7ff",
          borderRadius: "14px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          transition: "box-shadow 0.2s ease, transform 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow =
            "0 6px 18px rgba(0,0,0,0.12)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow =
            "0 2px 8px rgba(0,0,0,0.05)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <div className="card-body d-flex flex-column">
          {/* HEADER */}
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h5 className="fw-bold mb-1">{deal.brand_name}</h5>
              <div className="text-muted small">{deal.platform}</div>
            </div>

            <span
  className={`badge bg-${statusColor[deal.status]} text-capitalize px-3 py-2 rounded-pill`}
  style={{
    fontSize: "0.75rem",
    lineHeight: "1.8",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  }}
>
  {deal.status}
</span>

          </div>

          {/* AMOUNT */}
          <div className="fs-5 fw-bold mt-3">
            {deal.currency} {deal.amount}
          </div>
          {/* PROOF IMAGES (PRO ONLY) */}
{deal.proof_images?.length > 0 && (
  <div className="deal-proof-container mt-3">
    {deal.proof_images.map((img, i) => (
      <img
        key={i}
        src={img}
        alt="Deal proof"
        className="deal-proof-image"
        onClick={() => window.open(img, "_blank")}
      />
    ))}
  </div>
)}

{/* ADD IMAGE BUTTON (PRO ONLY) */}
{user.plan === "pro" && (
  <DealImageUpload deal={deal} onUpdated={onUpdated} />
)}


          {/* DATES */}
          <div className="mt-3 text-muted small">
            {deal.posting_date && (
              <div>
                Posting:{" "}
                {new Date(deal.posting_date).toLocaleDateString()}
              </div>
            )}
            {deal.payment_due_date && (
              <div>
                Due:{" "}
                {new Date(deal.payment_due_date).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="mt-auto pt-3 d-flex justify-content-between">
            <button
              className="btn btn-sm btn-outline-dark"
              onClick={() => setShowEdit(true)}
            >
              Edit
            </button>

            {user.plan === "pro" ? (
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => setShowConfirm(true)}
              >
                Delete
              </button>
            ) : (
              <span className="text-muted small"></span>
            )}
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {showEdit && (
        <EditDealModal
          deal={deal}
          onClose={() => setShowEdit(false)}
          onUpdated={onUpdated}
        />
      )}

      {/* DELETE CONFIRM MODAL */}
      {showConfirm && (
        <div
          className="modal fade show d-block"
          style={{ background: "rgba(0,0,0,0.55)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-0 pb-0">
                <h5 className="fw-bold text-danger mb-0">
                  Delete Deal
                </h5>
              </div>

              <div className="modal-body pt-2">
                <div className="p-3 rounded-3 bg-light">
                  <p className="mb-1 fw-semibold">
                    {deal.brand_name}
                  </p>
                  <p className="text-muted mb-2">
                    {deal.currency} {deal.amount}
                  </p>
                  <p className="text-danger small mb-0">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button
                  className="btn btn-light"
                  onClick={() => setShowConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger px-4"
                  disabled={deleting}
                  onClick={handleDelete}
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
