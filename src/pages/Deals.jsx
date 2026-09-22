import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { fetchDeals } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import AddDealModal from "../components/AddDealModal";
import DealCard from "../components/DealCard";
import "../styles/deals.css";

const FILTERS = [
  ["all", "All"],
  ["pending", "Pending"],
  ["active", "Active"],
  ["completed", "Completed"],
  ["overdue", "Overdue"]
];

export default function Deals() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchDeals()
      .then((data) => {
        if (alive) setDeals(data.deals || []);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const counts = useMemo(() => ({
    all: deals.length,
    pending: deals.filter((deal) => deal.status === "pending").length,
    active: deals.filter((deal) => deal.status === "active").length,
    completed: deals.filter((deal) => deal.status === "completed").length,
    overdue: deals.filter((deal) => deal.status === "overdue").length
  }), [deals]);

  const visibleDeals = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return deals.filter((deal) => {
      const matchesFilter = filter === "all" || deal.status === filter;
      const searchable = [deal.brand_name, deal.platform, deal.platform_custom, deal.product_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesFilter && (!normalized || searchable.includes(normalized));
    });
  }, [deals, filter, query]);

  const handleDealCreated = (newDeal) => {
    setDeals((prev) => [newDeal, ...prev]);
    setUser((prev) => prev ? {
      ...prev,
      deal_creations_used: Math.max(Number(prev.deal_creations_used) || 0, deals.length) + 1
    } : prev);
    setShowAddModal(false);
  };

  const handleDealUpdated = (updated) => {
    setDeals((prev) => prev.map((deal) => (deal.id === updated.id ? updated : deal)));
  };

  const handleDealDeleted = (dealId) => {
    setDeals((prev) => prev.filter((deal) => deal.id !== dealId));
  };

  return (
    <div className="deals-page">
      <Helmet><title>Deals - Brandio</title></Helmet>

      <header className="deals-header">
        <div>
          <span>Deals</span>
          <h1>Your deals</h1>
          <p>Track brand work, payments and deliverables from one place.</p>
        </div>
        <button disabled={isFreeDealLimitUsed(user, deals.length)} onClick={() => setShowAddModal(true)}>
          + Add Deal
        </button>
      </header>

      <section className="deals-toolbar">
        <div className="deals-filters">
          {FILTERS.map(([id, label]) => (
            <button key={id} className={filter === id ? "active" : ""} onClick={() => setFilter(id)}>
              {label}<span>{counts[id] || 0}</span>
            </button>
          ))}
        </div>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search brand or platform" />
      </section>

      {isFreeDealLimitUsed(user, deals.length) && (
        <section className="deals-paywall">
          <div>
            <h2>Your 3 free deal credits are used.</h2>
            <p>Deleting deals does not reset free credits. Upgrade your plan to add more deals.</p>
          </div>
          <button onClick={() => navigate("/pricing")}>View plans</button>
        </section>
      )}

      {loading && <div className="deals-empty">Loading deals...</div>}
      {!loading && visibleDeals.length === 0 && (
        <div className="deals-empty">
          <h2>{deals.length ? "No deals match this view" : "No deals yet"}</h2>
          <p>{deals.length ? "Try another status or search term." : "Add your first brand deal to start tracking scope, payment and delivery."}</p>
          {!deals.length && <button onClick={() => setShowAddModal(true)}>Add Deal</button>}
        </div>
      )}
      {!loading && visibleDeals.length > 0 && (
        <section className="deals-grid">
          {visibleDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onUpdated={handleDealUpdated} onDeleted={handleDealDeleted} />
          ))}
        </section>
      )}

      {showAddModal && (
        <AddDealModal
          onClose={() => setShowAddModal(false)}
          onCreated={handleDealCreated}
          totalDeals={freeDealCreditsUsed(user, deals.length)}
          plan={user.plan}
        />
      )}
    </div>
  );
}

function freeDealCreditsUsed(user, currentDeals) {
  return Math.max(Number(user?.deal_creations_used) || 0, currentDeals || 0);
}

function isFreeDealLimitUsed(user, currentDeals) {
  return user?.plan === "free" && freeDealCreditsUsed(user, currentDeals) >= 3;
}
