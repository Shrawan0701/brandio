import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchDeals } from "../lib/api";

import DealCard from "../components/DealCard";
import UpgradeCard from "../components/UpgradeCard";
import AddDealModal from "../components/AddDealModal";

export default function Dashboard() {
  const { user } = useAuth();

  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  /* Fetch deals */
  useEffect(() => {
    fetchDeals()
      .then((data) => setDeals(data.deals || []))
      .finally(() => setLoading(false));
  }, []);

  /* TOTAL deals count */
  const totalDeals = deals.length;

  /* Quota banner logic */
  const showQuotaBanner =
    user.plan === "free" && totalDeals >= 3;

  const remainingDeals =
    user.plan === "free" ? Math.max(5 - totalDeals, 0) : null;

  /* Add deal handler */
  const handleDealCreated = (newDeal) => {
    setDeals((prev) => [newDeal, ...prev]);
    setShowAddModal(false);
  };

  /* 🔥 DELETE HANDLER — THIS WAS MISSING */
  const handleDealDeleted = (dealId) => {
    setDeals((prev) => prev.filter((d) => d.id !== dealId));
  };

  /* Update handler (already existed conceptually) */
  const handleDealUpdated = (updated) => {
    setDeals((prev) =>
      prev.map((d) => (d.id === updated.id ? updated : d))
    );
  };

  return (
    <div className="container py-5">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Your Deals</h2>

        <button
          className="btn btn-dark"
          disabled={user.plan === "free" && totalDeals >= 5}
          onClick={() => setShowAddModal(true)}
        >
          + Add Deal
        </button>
      </div>

      {/* Free plan quota banner */}
  {user.plan === "free" && totalDeals >= 3 && (
  <div className="upgrade-banner mb-4">
    <div>
      <h5 className="mb-1">Free plan limit</h5>
      <p className="mb-0 text-muted">
        You’ve used {totalDeals}/5 deals this month.
      </p>
    </div>
  </div>
)}


      {/* Loading */}
      {loading && (
        <div className="text-muted">Loading your deals…</div>
      )}

      {/* Empty state */}
      {!loading && deals.length === 0 && (
        <div className="text-center text-muted mt-5">
          <p className="mb-1">No deals yet.</p>
          <p>Add your first brand deal to start tracking.</p>
        </div>
      )}

      {/* Deals grid */}
      {!loading && deals.length > 0 && (
        <div className="row g-4">
          {deals.map((deal) => (
            <div className="col-md-4" key={deal.id}>
              <DealCard
                deal={deal}
                onUpdated={handleDealUpdated}
                onDeleted={handleDealDeleted} // ✅ THIS FIXES BLANK SCREEN
              />
            </div>
          ))}

          {/* Upgrade CTA card */}
         
        </div>
      )}

      {/* Add Deal Modal */}
      {showAddModal && (
        <AddDealModal
          onClose={() => setShowAddModal(false)}
          onCreated={handleDealCreated}
          totalDeals={totalDeals}
          plan={user.plan}
        />
      )}
    </div>
  );
}
