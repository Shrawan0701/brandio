import { WorkspaceHeader, WorkspaceStats, WorkspaceSearch, WorkspaceIcon } from "../components/WorkspaceUI";
import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { fetchDeals } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import AddDealModal from "../components/AddDealModal";
import DealCard from "../components/DealCard";
import { freeDealCreditsUsed, isFreeDealLimitUsed } from "../utils/pricing";
import "../styles/deals.css";

const FILTERS = [
  ["all", "All"],
  ["pending", "Pending"],
  ["active", "Active"],
  ["completed", "Completed"],
  ["overdue", "Overdue"]
];

export default function Deals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetchDeals()
      .then((data) => {
        if (alive) setDeals(data.deals || []);
      })
      .catch(() => { if (alive) setError("Could not load your deals. Please try again."); })
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
    setShowAddModal(false);
  };

  const handleDealUpdated = (updated) => {
    setDeals((prev) => prev.map((deal) => (deal.id === updated.id ? updated : deal)));
  };

  const handleDealDeleted = (dealId) => {
    setDeals((prev) => prev.filter((deal) => deal.id !== dealId));
  };

  return (
    <div className="deals-page workspace-page">
      <Helmet><title>Deals - Brandio</title></Helmet>

      <WorkspaceHeader eyebrow="Main / Deals" title="Your deals" description="Track brand work, payments, and the next step for every collaboration." actions={<button className="ws-button ws-primary" disabled={loading} onClick={() => setShowAddModal(true)}><WorkspaceIcon name="plus" /> Add deal</button>} />
      <WorkspaceStats items={[
        { label: "Total deals", value: counts.all, note: "Across your workspace", icon: "deals" },
        { label: "In progress", value: counts.pending + counts.active + counts.overdue, note: "Open collaborations", icon: "clock", tone: "blue" },
        { label: "Completed", value: counts.completed, note: "Finished collaborations", icon: "check", tone: "green" },
        { label: "Overdue", value: counts.overdue, note: "Ready for a follow-up", icon: "alert", tone: "amber" }
      ]} />

      <section className="deals-toolbar">
        <div className="deals-filters">
          {FILTERS.map(([id, label]) => (
            <button key={id} className={filter === id ? "active" : ""} aria-pressed={filter === id} onClick={() => setFilter(id)}>
              {label}<span>{counts[id] || 0}</span>
            </button>
          ))}
        </div>
        <WorkspaceSearch value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search brand or platform" label="Search deals" />
      </section>

      {isFreeDealLimitUsed(user, deals.length) && (
        <section className="deals-paywall">
          <div>
            <h2>Your 1 lifetime free deal has been used.</h2>
            <p>All features remain available for your existing deal. Deleting it does not reset your allowance. Upgrade to add more deals.</p>
          </div>
          <button onClick={() => navigate("/pricing")}>View plans</button>
        </section>
      )}

      {loading && <div className="deals-empty">Loading deals...</div>}
      {!loading && error && <div className="deals-empty" role="alert">{error}</div>}
      {!loading && !error && visibleDeals.length === 0 && (
        <div className="deals-empty">
          <h2>{deals.length ? "No deals match this view" : "No deals yet"}</h2>
          <p>{deals.length ? "Try another status or search term." : "Add your first brand deal to start tracking scope, payment and delivery."}</p>
          {!deals.length && <button className="ws-button ws-primary" onClick={() => setShowAddModal(true)}>Add deal</button>}
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
        />
      )}
    </div>
  );
}
