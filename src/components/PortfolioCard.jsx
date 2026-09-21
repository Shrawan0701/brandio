import {
  formatAmount,
  formatCompactNumber,
  formatLongDate,
  formatPlatform,
  visibleMetrics
} from "../utils/portfolio";

/* =========================================================
   PORTFOLIO CARD
   Large visual campaign card — one completed deal, told well.
   ========================================================= */

export default function PortfolioCard({
  item,
  busy,
  onEdit,
  onToggleFeatured,
  onToggleVisibility,
  onRemove
}) {
  const metrics = visibleMetrics(item.metrics);
  const completed = formatLongDate(item.completion_date || item.posting_date);
  const brand = item.brand_name || "Untitled brand";
  const initial = brand.trim().charAt(0).toUpperCase() || "★";
  const hasAmount =
    item.amount !== null && item.amount !== undefined && item.amount !== "";

  return (
    <article className={`pf-card${item.is_featured ? " is-featured" : ""}`}>
      {/* ---------------- thumbnail ---------------- */}
      <div className="pf-thumb">
        {item.thumbnail_url ? (
          <img
            src={item.thumbnail_url}
            alt={`${brand} campaign`}
            loading="lazy"
          />
        ) : (
          <div className="pf-thumb-fallback">
            <div className="pf-thumb-initial">{initial}</div>
            <div className="pf-thumb-brand">{brand}</div>
          </div>
        )}

        {item.is_featured && (
          <span className="pf-badge-featured">★ Featured</span>
        )}

        <span className="pf-badge-visibility">
          {item.is_public ? "◉ Public" : "◌ Private"}
        </span>

        <span className="pf-platform-pill">{formatPlatform(item)}</span>
      </div>

      {/* ---------------- body ---------------- */}
      <div className="pf-body">
        <div className="pf-brand">{brand}</div>

        <h3 className="pf-campaign">{item.campaign_title || brand}</h3>

        {item.deliverables?.length > 0 && (
          <div className="pf-deliverables">
            {item.deliverables.map((deliverable, index) => (
              <span className="pf-deliverable" key={`${deliverable}-${index}`}>
                {deliverable}
              </span>
            ))}
          </div>
        )}

        {item.creator_notes && <p className="pf-notes">{item.creator_notes}</p>}

        {metrics.length > 0 && (
          <div className="pf-metrics">
            {metrics.map((metric) => (
              <div key={metric.key}>
                <div className="pf-metric-value">
                  {metric.key === "engagement_rate"
                    ? `${metric.value}%`
                    : formatCompactNumber(metric.value)}
                </div>
                <div className="pf-metric-label">{metric.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="pf-foot">
          <div className="pf-foot-meta">
            {completed ? `Completed ${completed}` : "Completion date not set"}
            {item.content_url && (
              <>
                {" · "}
                <a
                  className="pf-content-link"
                  href={item.content_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  View content ↗
                </a>
              </>
            )}
          </div>

          {hasAmount && (
            <div className="pf-amount">
              {formatAmount(item.amount, item.currency)}
            </div>
          )}
        </div>
      </div>

      {/* ---------------- actions ---------------- */}
      <div className="pf-actions">
        <button
          className="pf-action"
          onClick={() => onEdit(item)}
          disabled={busy}
        >
          Edit
        </button>

        <button
          className={`pf-action${item.is_featured ? " is-on" : ""}`}
          onClick={() => onToggleFeatured(item)}
          disabled={busy}
        >
          {item.is_featured ? "★ Featured" : "☆ Feature"}
        </button>

        <button
          className={`pf-action${item.is_public ? " is-on" : ""}`}
          onClick={() => onToggleVisibility(item)}
          disabled={busy}
        >
          {item.is_public ? " Private" : "Public"}
        </button>

        <button
          className="pf-action danger"
          onClick={() => onRemove(item)}
          disabled={busy}
        >
          Remove
        </button>
      </div>
    </article>
  );
}