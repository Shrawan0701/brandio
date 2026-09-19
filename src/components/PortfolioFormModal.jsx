import { useEffect, useState } from "react";
import {
  createPortfolioItem,
  updatePortfolioItem,
  uploadPortfolioThumbnail
} from "../lib/api";
import {
  METRIC_FIELDS,
  deliverablesToInput,
  formatAmount,
  formatLongDate,
  formatPlatform,
  metricsFromItem,
  parseDeliverables
} from "../utils/portfolio";

/* =========================================================
   PORTFOLIO FORM MODAL
   Create (from a completed deal) or edit an existing item.
   ========================================================= */

const todayInput = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

export default function PortfolioFormModal({
  deal,
  existing,
  onClose,
  onSaved
}) {
  /* the source deal: either the picked deal or the item's joined deal fields */
  const source = existing || deal || {};

  const [campaignTitle, setCampaignTitle] = useState(
    existing?.campaign_title || source.brand_name || ""
  );
  const [deliverablesInput, setDeliverablesInput] = useState(
    deliverablesToInput(existing?.deliverables)
  );
  const [completionDate, setCompletionDate] = useState(
    existing?.completion_date || source.posting_date || todayInput()
  );
  const [contentUrl, setContentUrl] = useState(existing?.content_url || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(
    existing?.thumbnail_url || ""
  );
  const [metricValues, setMetricValues] = useState(
    metricsFromItem(existing?.metrics)
  );
  const [notes, setNotes] = useState(existing?.creator_notes || "");
  const [isPublic, setIsPublic] = useState(existing?.is_public ?? false);
  const [isFeatured, setIsFeatured] = useState(existing?.is_featured ?? false);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !saving && !uploading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving, uploading]);

  const updateMetric = (key, value) =>
    setMetricValues((prev) => ({ ...prev, [key]: value }));

  const buildMetrics = () => {
    const metrics = {};

    for (const field of METRIC_FIELDS) {
      const raw = metricValues[field.key];
      if (raw === "" || raw === undefined || raw === null) continue;

      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0) continue;

      metrics[field.key] = value;
    }

    return metrics;
  };

  const handleThumbnail = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError("");
      setUploading(true);
      const url = await uploadPortfolioThumbnail(file);
      setThumbnailUrl(url);
    } catch (err) {
      setError(err.message || "Thumbnail upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    const trimmedUrl = contentUrl.trim();

    if (trimmedUrl && !/^https?:\/\//i.test(trimmedUrl)) {
      setError("Content URL must start with http:// or https://");
      return;
    }

    const payload = {
      campaign_title: campaignTitle.trim() || source.brand_name || null,
      deliverables: parseDeliverables(deliverablesInput),
      completion_date: completionDate || null,
      content_url: trimmedUrl || null,
      thumbnail_url: thumbnailUrl || null,
      metrics: buildMetrics(),
      creator_notes: notes.trim() || null,
      is_public: isPublic,
      is_featured: isFeatured
    };

    try {
      setSaving(true);
      setError("");

      const saved = existing
        ? await updatePortfolioItem(existing.id, payload)
        : await createPortfolioItem({ ...payload, deal_id: source.id });

      onSaved(saved, !existing);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not save this portfolio item. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop-custom">
      <div className="pf-modal" style={{ margin: "20px" }}>
        <div className="pf-modal-head">
          <div>
            <h3>{existing ? "Edit portfolio item" : "Add to portfolio"}</h3>
            <p>
              {existing
                ? "Sharpen the details creators and brands will see."
                : "Turn this completed deal into a campaign you can show off."}
            </p>
          </div>

          <button
            className="pf-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* source deal — read-only, never duplicated */}
        <div className="pf-deal-summary">
          <div>
            <div className="pf-deal-summary-brand">
              {source.brand_name || "Brand"}
            </div>
            <div className="pf-deal-summary-meta">
              {formatPlatform(source)}
              {(existing?.completion_date || source.posting_date) &&
                ` · completed ${formatLongDate(
                  existing?.completion_date || source.posting_date
                )}`}
            </div>
          </div>

          <div className="pf-deal-summary-amount">
            {formatAmount(source.amount, source.currency)}
          </div>
        </div>

        {error && <div className="pf-error">{error}</div>}

        <div className="pf-field">
          <label className="pf-label">Campaign name</label>
          <input
            className="pf-input"
            placeholder="e.g. Summer Skincare Launch"
            value={campaignTitle}
            onChange={(e) => setCampaignTitle(e.target.value)}
          />
          <div className="pf-help">
            Give the collaboration a name — this is the headline on your card.
          </div>
        </div>

        <div className="pf-field">
          <label className="pf-label">Deliverables</label>
          <input
            className="pf-input"
            placeholder="1 Reel, 2 Stories, 1 YouTube integration"
            value={deliverablesInput}
            onChange={(e) => setDeliverablesInput(e.target.value)}
          />
          <div className="pf-help">
            Separate with commas — up to 8 deliverables.
          </div>
        </div>

        <div className="pf-field-row">
          <div className="pf-field">
            <label className="pf-label">Completion date</label>
            <input
              type="date"
              className="pf-input"
              value={completionDate || ""}
              onChange={(e) => setCompletionDate(e.target.value)}
            />
          </div>

          <div className="pf-field">
            <label className="pf-label">Content URL</label>
            <input
              className="pf-input"
              placeholder="https://instagram.com/p/..."
              value={contentUrl}
              onChange={(e) => setContentUrl(e.target.value)}
            />
          </div>
        </div>

        {/* thumbnail upload / preview */}
        <div className="pf-field">
          <label className="pf-label">Campaign thumbnail</label>

          <div className="pf-thumb-upload">
            {thumbnailUrl ? (
              <img
                className="pf-thumb-preview"
                src={thumbnailUrl}
                alt="Campaign thumbnail"
              />
            ) : (
              <div className="pf-thumb-preview" />
            )}

            <div className="pf-thumb-upload-actions">
              <label className="pf-upload-btn">
                {uploading ? "Uploading…" : "Upload image"}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={uploading}
                  onChange={handleThumbnail}
                />
              </label>

              {thumbnailUrl && (
                <button
                  className="pf-ghost-btn"
                  onClick={() => setThumbnailUrl("")}
                  disabled={uploading}
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="pf-help">
            A wide shot of the content, a brand asset, or the post itself.
          </div>
        </div>

        {/* performance metrics — optional */}
        <div className="pf-field">
          <label className="pf-label">Performance (optional)</label>

          <div className="pf-metric-inputs">
            {METRIC_FIELDS.map((field) => (
              <div key={field.key}>
                <input
                  type="number"
                  min="0"
                  className="pf-input"
                  placeholder={field.placeholder}
                  value={metricValues[field.key] ?? ""}
                  onChange={(e) => updateMetric(field.key, e.target.value)}
                />
                <div className="pf-metric-label">{field.label}</div>
              </div>
            ))}
          </div>

          <div className="pf-help">
            Views, likes, comments, shares, saves and engagement %. Leave blank
            if you don't have the numbers yet.
          </div>
        </div>

        <div className="pf-field">
          <label className="pf-label">Creator notes</label>
          <textarea
            className="pf-textarea"
            placeholder="How the campaign performed, what the brand loved, what you'd do differently…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="pf-toggles">
          <label className={`pf-toggle${isFeatured ? " is-on" : ""}`}>
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
            />
            <span>
              <span className="pf-toggle-title">Featured work</span>
              <span className="pf-toggle-sub">
                Pins this campaign to the top of your portfolio.
              </span>
            </span>
          </label>

          <label className={`pf-toggle${isPublic ? " is-on" : ""}`}>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            <span>
              <span className="pf-toggle-title">Public visibility</span>
              <span className="pf-toggle-sub">
                Marks the campaign as shareable proof of work.
              </span>
            </span>
          </label>
        </div>

        <div className="pf-modal-actions">
          <button
            className="pf-ghost-btn"
            onClick={onClose}
            disabled={saving || uploading}
          >
            Cancel
          </button>

          <button
            className="pf-cta"
            onClick={submit}
            disabled={saving || uploading}
          >
            {saving
              ? "Saving…"
              : existing
              ? "Save changes"
              : "Add to portfolio"}
          </button>
        </div>
      </div>
    </div>
  );
}