import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";

import {
  deletePortfolioItem,
  fetchPortfolio,
  togglePortfolioFeatured,
  togglePortfolioVisibility
} from "../lib/api";

import { useToast } from "../components/ToastProvider";
import PortfolioCard from "../components/PortfolioCard";
import PortfolioDealPicker from "../components/PortfolioDealPicker";
import PortfolioFormModal from "../components/PortfolioFormModal";

import { computeStats, formatCompactNumber } from "../utils/portfolio";

/* =========================================================
   PORTFOLIO · PROOF OF WORK
   Completed deals become visual campaign cards.
   ========================================================= */

const FILTERS = [
  { id: "all", label: "All work" },
  { id: "featured", label: "Featured" },
  { id: "public", label: "Public" },
  { id: "private", label: "Private" }
];

export default function Portfolio() {
  const { showToast } = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [formState, setFormState] = useState(null); // { deal } | { existing }
  const [removeTarget, setRemoveTarget] = useState(null);

  /* --------------------------------- data --------------------------------- */

  const load = useCallback(
    async ({ silent } = {}) => {
      try {
        if (!silent) setLoading(true);
        setError("");
        const data = await fetchPortfolio();
        setItems(data.items || []);
      } catch {
        setError("Could not load your portfolio");
        showToast("Could not load your portfolio", "error");
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => computeStats(items), [items]);

  const visible = useMemo(() => {
    if (filter === "featured") return items.filter((item) => item.is_featured);
    if (filter === "public") return items.filter((item) => item.is_public);
    if (filter === "private") return items.filter((item) => !item.is_public);
    return items;
  }, [items, filter]);

  const counts = useMemo(
    () => ({
      all: items.length,
      featured: stats.featured,
      public: stats.public,
      private: items.length - stats.public
    }),
    [items.length, stats.featured, stats.public]
  );

  const replaceItem = (item) =>
    setItems((prev) =>
      prev.map((entry) => (entry.id === item.id ? item : entry))
    );

  /* ------------------------------- mutations ------------------------------ */

  const handleToggleFeatured = async (item) => {
    try {
      setBusyId(item.id);
      const updated = await togglePortfolioFeatured(item.id, !item.is_featured);
      replaceItem(updated);
      showToast(
        updated.is_featured
          ? "Featured in your portfolio"
          : "Removed from featured"
      );
    } catch {
      showToast("Could not update featured status", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleVisibility = async (item) => {
    try {
      setBusyId(item.id);
      const updated = await togglePortfolioVisibility(item.id, !item.is_public);
      replaceItem(updated);
      showToast(
        updated.is_public ? "Campaign is now public" : "Campaign is now private"
      );
    } catch {
      showToast("Could not update visibility", "error");
    } finally {
      setBusyId(null);
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;

    try {
      setBusyId(removeTarget.id);
      await deletePortfolioItem(removeTarget.id);
      setItems((prev) => prev.filter((item) => item.id !== removeTarget.id));
      showToast("Removed from your portfolio");
      setRemoveTarget(null);
    } catch {
      showToast("Could not remove this item", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleSaved = (item, isNew) => {
    setItems((prev) =>
      isNew
        ? [item, ...prev]
        : prev.map((entry) => (entry.id === item.id ? item : entry))
    );
    setFormState(null);
    showToast(isNew ? "Added to your portfolio" : "Portfolio item updated");
  };

  return (
    <div className="pf-page">
      <Helmet>
        <title>Portfolio - Brandio</title>
        <meta
          name="description"
          content="Turn completed brand deals into a professional creator portfolio with campaigns, deliverables, performance and proof of work."
        />
      </Helmet>

      <div className="pf-shell">
        {/* --------------------------------- hero --------------------------------- */}
        <header className="pf-hero">
          <div>
            <span className="pf-eyebrow">Proof of work</span>
            <h1 className="pf-title">
              Your <span>portfolio</span>
            </h1>
            <p className="pf-subtitle">
              Every completed deal in Brandio can become a campaign you show to
              brands — deliverables, results and the story behind the work.
            </p>

            <div className="pf-hero-actions">
              <button
                className="pf-cta"
                onClick={() => setPickerOpen(true)}
                disabled={loading}
              >
                <span className="pf-cta-plus">+</span> Add from completed deals
              </button>

              <span className="pf-hero-note">
                {stats.total > 0
                  ? `${stats.total} campaign${
                      stats.total === 1 ? "" : "s"
                    } ready to share`
                  : "No campaigns added yet"}
              </span>
            </div>
          </div>

          <div className="pf-stats">
            <div className="pf-stat">
              <div className="pf-stat-value">{stats.total}</div>
              <div className="pf-stat-label">Campaigns</div>
            </div>

            <div className="pf-stat">
              <div className="pf-stat-value">{stats.featured}</div>
              <div className="pf-stat-label">Featured</div>
            </div>

            <div className="pf-stat">
              <div className="pf-stat-value">{stats.public}</div>
              <div className="pf-stat-label">Public</div>
            </div>

            <div className="pf-stat">
              <div className="pf-stat-value">
                {stats.reach > 0 ? formatCompactNumber(stats.reach) : "—"}
              </div>
              <div className="pf-stat-label">Tracked views</div>
            </div>
          </div>
        </header>

        {/* -------------------------------- toolbar -------------------------------- */}
        <div className="pf-toolbar">
          <div className="pf-filters">
            {FILTERS.map((entry) => (
              <button
                key={entry.id}
                className={`pf-chip${filter === entry.id ? " active" : ""}`}
                onClick={() => setFilter(entry.id)}
              >
                {entry.label}
                <span className="pf-chip-count">{counts[entry.id]}</span>
              </button>
            ))}
          </div>

          <span className="pf-toolbar-hint">
            {stats.platforms > 0
              ? `${stats.platforms} platform${
                  stats.platforms === 1 ? "" : "s"
                } covered`
              : "Your work, organised"}
          </span>
        </div>

        {/* -------------------------------- content ------------------------------- */}
        {loading && (
          <div className="pf-skeleton-grid">
            <div className="pf-skeleton-card" />
            <div className="pf-skeleton-card" />
            <div className="pf-skeleton-card" />
          </div>
        )}

        {!loading && error && (
          <div className="pf-empty-compact">{error}</div>
        )}

        {!loading && !error && items.length === 0 && (
          <section className="pf-empty">
            <div className="pf-empty-inner">
              <div className="pf-empty-mark">★</div>

              <h2>Your work deserves a spotlight</h2>

              <p>
                You have no portfolio campaigns yet. Completed deals inside
                Brandio turn into visual proof of work in a few clicks — no
                spreadsheets, no screenshots lost in a camera roll.
              </p>

              <button className="pf-cta" onClick={() => setPickerOpen(true)}>
                <span className="pf-cta-plus">+</span> Add your first campaign
              </button>

              <div className="pf-empty-steps">
                <div className="pf-empty-step">
                  <span>1</span>
                  <h4>Complete a deal</h4>
                  <p>Mark the collaboration as completed on your dashboard.</p>
                </div>

                <div className="pf-empty-step">
                  <span>2</span>
                  <h4>Add the showcase details</h4>
                  <p>Campaign name, deliverables, thumbnail and content link.</p>
                </div>

                <div className="pf-empty-step">
                  <span>3</span>
                  <h4>Feature the best work</h4>
                  <p>Pin your strongest campaigns and mark them public.</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {!loading && !error && items.length > 0 && visible.length === 0 && (
          <div className="pf-empty-compact">
            Nothing here yet for this filter.
          </div>
        )}

        {!loading && !error && visible.length > 0 && (
          <div className="pf-grid">
            {visible.map((item) => (
              <PortfolioCard
                key={item.id}
                item={item}
                busy={busyId === item.id}
                onEdit={(target) => setFormState({ existing: target })}
                onToggleFeatured={handleToggleFeatured}
                onToggleVisibility={handleToggleVisibility}
                onRemove={(target) => setRemoveTarget(target)}
              />
            ))}
          </div>
        )}
      </div>

      {/* --------------------------------- modals -------------------------------- */}
      {pickerOpen && (
        <PortfolioDealPicker
          onClose={() => setPickerOpen(false)}
          onPick={(deal) => {
            setPickerOpen(false);
            setFormState({ deal });
          }}
          onChanged={() => load({ silent: true })}
        />
      )}

      {formState && (
        <PortfolioFormModal
          deal={formState.deal}
          existing={formState.existing}
          onClose={() => setFormState(null)}
          onSaved={handleSaved}
        />
      )}

      {removeTarget && (
        <div className="modal-backdrop-custom">
          <div className="pf-modal is-narrow" style={{ margin: "20px" }}>
            <div className="pf-modal-head">
              <div>
                <h3>Remove campaign</h3>
                <p>
                  {removeTarget.campaign_title || removeTarget.brand_name} will
                  be removed from your portfolio.
                </p>
              </div>
            </div>

            <div className="pf-deal-summary">
              <div>
                <div className="pf-deal-summary-brand">
                  {removeTarget.brand_name}
                </div>
                <div className="pf-deal-summary-meta">
                  The deal itself stays safe in your dashboard.
                </div>
              </div>
            </div>

            <div className="pf-modal-actions">
              <button
                className="pf-ghost-btn"
                onClick={() => setRemoveTarget(null)}
                disabled={busyId === removeTarget.id}
              >
                Keep it
              </button>

              <button
                className="pf-cta"
                onClick={confirmRemove}
                disabled={busyId === removeTarget.id}
              >
                {busyId === removeTarget.id ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
