import { useEffect, useState } from "react";
import { createPortfolioItem, fetchPortfolioCandidates } from "../lib/api";
import { formatAmount, formatLongDate, formatPlatform } from "../utils/portfolio";

/* =========================================================
   ADD TO PORTFOLIO — deal picker
   Lists completed deals that are not portfolio items yet.
   "Add" opens the detail form, "Quick add all" uses defaults.
   ========================================================= */

export default function PortfolioDealPicker({ onClose, onPick, onChanged }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bulk, setBulk] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPortfolioCandidates()
      .then((data) => setDeals(data.deals || []))
      .catch(() => setError("Could not load your completed deals"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const quickAddAll = async () => {
    try {
      setBulk(true);
      setError("");

      for (const deal of deals) {
        try {
          await createPortfolioItem({ deal_id: deal.id });
        } catch {
          /* a deal that is already a portfolio item is simply skipped */
        }
      }

      await onChanged();
      onClose();
    } catch {
      setError("Could not add your deals right now");
    } finally {
      setBulk(false);
    }
  };

  return (
    <div className="modal-backdrop-custom">
      <div className="pf-modal" style={{ margin: "20px" }}>
        <div className="pf-modal-head">
          <div>
            <h3>Add to portfolio</h3>
            <p>
              Pick a completed deal. Brand, platform and amount come straight
              from the deal — you only add the showcase details.
            </p>
          </div>

          <button className="pf-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {error && <div className="pf-error">{error}</div>}

        {loading && <div className="pf-help">Loading completed deals…</div>}

        {!loading && deals.length === 0 && (
          <div className="pf-picker-empty">
            <h4>No completed deals available</h4>
            <p>
              Mark a deal as <b>completed</b> on your dashboard and it will show
              up here, ready to become proof of work.
            </p>
            <button className="pf-ghost-btn" onClick={onClose}>
              Back to portfolio
            </button>
          </div>
        )}

        {!loading && deals.length > 0 && (
          <>
            <div className="pf-picker-list">
              {deals.map((deal) => (
                <div className="pf-picker-item" key={deal.id}>
                  <div>
                    <div className="pf-picker-brand">{deal.brand_name}</div>
                    <div className="pf-picker-meta">
                      {formatPlatform(deal)}
                      {deal.posting_date
                        ? ` · completed ${formatLongDate(deal.posting_date)}`
                        : ""}
                    </div>
                    <div className="pf-picker-amount">
                      {formatAmount(deal.amount, deal.currency)}
                    </div>
                  </div>

                  <button
                    className="pf-picker-add"
                    onClick={() => onPick(deal)}
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>

            <div className="pf-modal-actions">
              <button className="pf-ghost-btn" onClick={onClose}>
                Cancel
              </button>

              {deals.length > 1 && (
                <button
                  className="pf-cta"
                  onClick={quickAddAll}
                  disabled={bulk}
                >
                  {bulk ? "Adding…" : `Quick add all (${deals.length})`}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}