import {
  statusInfo,
  formatShortDate,
  SIGNATURE_STATUSES
} from "../utils/contracts";

/* =========================================================
   CONTRACT CARD · polished viewer for one deal's contract
   Shows: title, brand, status, uploaded, expires + actions
   ========================================================= */

export default function ContractCard({
  contract,
  busy = false,
  onView,
  onDownload,
  onReplace,
  onMarkSigned,
  onMarkAwaiting,
  onRemove
}) {
  if (!contract) return null;

  const info = statusInfo(contract);
  const signed = contract.expiry_state === "signed" || contract.status === "signed";

  return (
    <div className="ct-doc-card">
      <div className="ct-doc-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
          <path
            d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M14 3v4h4M9 12h6M9 15.5h6M9 19h4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="ct-doc-main">
        <div className="ct-doc-title-row">
          <h4 className="ct-doc-title">{contract.title}</h4>
          <span className={`ct-pill ct-pill-${info.tone}`}>{info.label}</span>
        </div>

        <p className="ct-doc-brand">
          Brand: <strong>{contract.brand_name}</strong>
          <span className="ct-dot">·</span>
          <span>{SIGNATURE_STATUSES[contract.signature_status] || "Awaiting signature"}</span>
        </p>

        <div className="ct-doc-meta">
          <span>
            Uploaded: <strong>{formatShortDate(contract.created_at)}</strong>
          </span>
          <span>
            Expires: <strong>{formatShortDate(contract.expires_at)}</strong>
          </span>
          {contract.signed_at && (
            <span>
              Signed: <strong>{formatShortDate(contract.signed_at)}</strong>
            </span>
          )}
        </div>

        <div className="ct-doc-actions">
          {contract.file_url && (
            <>
              <button
                className="ct-btn ct-btn-primary"
                onClick={onView}
                disabled={busy}
              >
                View
              </button>
              <button
                className="ct-btn"
                onClick={onDownload}
                disabled={busy}
              >
                Download
              </button>
            </>
          )}
          <button className="ct-btn" onClick={onReplace} disabled={busy}>
            {contract.file_url ? "Replace" : "Upload"}
          </button>
          {!signed ? (
            <button
              className="ct-btn ct-btn-success"
              onClick={onMarkSigned}
              disabled={busy}
            >
              {busy ? "Saving…" : "Mark signed"}
            </button>
          ) : (
            <button
              className="ct-btn"
              onClick={onMarkAwaiting}
              disabled={busy}
            >
              {busy ? "Saving…" : "Mark awaiting signature"}
            </button>
          )}
          <button
            className="ct-btn ct-btn-danger"
            onClick={onRemove}
            disabled={busy}
          >
            Remove
          </button>
        </div>

        <p className="ct-fineprint">
          Status tracking only — Brandio does not provide legal e-signatures.
        </p>
      </div>
    </div>
  );
}
