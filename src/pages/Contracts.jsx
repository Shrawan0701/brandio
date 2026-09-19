import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useToast } from "../components/ToastProvider";
import ContractUploadModal from "../components/ContractUploadModal";
import {
  attachContract,
  deleteContract,
  fetchContracts,
  fetchDealContract,
  setContractStatus,
  updateContract
} from "../lib/api";
import {
  statusInfo,
  formatFullDate,
  formatShortDate,
  daysUntil,
  computeContractStats
} from "../utils/contracts";

/* =========================================================
   CONTRACTS · global page with status filters.
   "Signed" is creator-marked tracking only — no legal
   e-signature claim is made here.
   ========================================================= */

const FILTERS = [
  { id: "all", label: "All contracts" },
  { id: "awaiting_signature", label: "Awaiting signature" },
  { id: "signed", label: "Signed" },
  { id: "expiring_soon", label: "Expiring soon" },
  { id: "expired", label: "Expired" }
];

export default function Contracts() {
  const { showToast } = useToast();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);
  const [modalState, setModalState] = useState(null);


  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchContracts();
      setContracts(data.contracts || []);
    } catch {
      setError("Could not load contracts");
      showToast("Could not load contracts", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => computeContractStats(contracts), [contracts]);

  const visible = useMemo(() => {
    if (filter === "all") return contracts;
    return contracts.filter((c) => c.expiry_state === filter);
  }, [contracts, filter]);

  const counts = useMemo(
    () => ({
      all: contracts.length,
      awaiting_signature: stats.awaiting_signature,
      signed: stats.signed,
      expiring_soon: stats.expiring_soon,
      expired: stats.expired
    }),
    [contracts.length, stats]
  );

  const replaceOne = (updated) =>
    setContracts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

  const handleStatus = async (contract, status) => {
    try {
      setBusyId(contract.id);
      replaceOne(await setContractStatus(contract.id, status));
      showToast(status === "signed" ? "Marked as signed" : "Marked as awaiting");
    } catch {
      showToast("Could not update status", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (contract) => {
    if (!window.confirm(`Remove the contract for ${contract.brand_name}?`)) return;
    try {
      setBusyId(contract.id);
      await deleteContract(contract.id);
      setContracts((prev) => prev.filter((c) => c.id !== contract.id));
      showToast("Contract removed");
    } catch {
      showToast("Could not remove contract", "error");
    } finally {
      setBusyId(null);
    }
  };

  const openForDeal = async (dealLike) => {
    try {
      const existing = await fetchDealContract(dealLike.deal_id);
      setModalState({ deal: dealLike, existing });
    } catch {
      setModalState({ deal: dealLike, existing: null });
    }
  };

  const handleSaved = async (payload) => {
    if (!modalState) return;
    try {
      const saved = modalState.existing
        ? await updateContract(modalState.existing.id, payload)
        : await attachContract(modalState.deal.deal_id, payload);
      setContracts((prev) => {
        const found = prev.some((c) => c.id === saved.id);
        return found ? prev.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...prev];
      });
      setModalState(null);
      showToast("Contract saved");
    } catch (err) {
      showToast(err.response?.data?.message || "Could not save contract", "error");
    }
  };

  return (
    <div className="ct-page">
      <Helmet>
        <title>Contracts - Brandio</title>
        <meta
          name="description"
          content="Track brand deal contracts — awaiting signature, signed, expiring soon and expired."
        />
      </Helmet>

      <div className="ct-shell">
        <header className="ct-hero">
          <div>
            <span className="ct-eyebrow">Paperwork, handled</span>
            <h1 className="ct-title">
              Your <span>contracts</span>
            </h1>
            <p className="ct-subtitle">
              Every deal&apos;s agreement in one place — upload, track signature
              status and never miss an expiry.
            </p>
          </div>

          <div className="ct-stats">
            <div className="ct-stat">
              <div className="ct-stat-value">{stats.total}</div>
              <div className="ct-stat-label">Total</div>
            </div>
            <div className="ct-stat">
              <div className="ct-stat-value">{stats.awaiting_signature}</div>
              <div className="ct-stat-label">Awaiting</div>
            </div>
            <div className="ct-stat">
              <div className="ct-stat-value">{stats.signed}</div>
              <div className="ct-stat-label">Signed</div>
            </div>
            <div className="ct-stat">
              <div className="ct-stat-value">{stats.expired}</div>
              <div className="ct-stat-label">Expired</div>
            </div>
          </div>
        </header>

        <div className="ct-filters">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={`ct-filter ${filter === f.id ? "ct-filter-active" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
              <span className="ct-filter-count">{counts[f.id] ?? 0}</span>
            </button>
          ))}
        </div>

        {loading && <div className="ct-muted">Loading your contracts…</div>}

        {!loading && error && (
          <div className="ct-empty-page">
            <h3>{error}</h3>
            <p>Please try again after the API is available.</p>
          </div>
        )}

        {!loading && !error && visible.length === 0 && (
          <div className="ct-empty-page">
            <div className="ct-empty-page-icon">▤</div>
            <h3>{contracts.length === 0 ? "No contracts yet" : "Nothing in this view"}</h3>
            <p>Attach an agreement to any deal and it will show up here.</p>
          </div>
        )}

        {!loading && !error && visible.length > 0 && (
          <div className="ct-list">
            {visible.map((c) => {
              const info = statusInfo(c);
              const days = daysUntil(c.expires_at);
              const busy = busyId === c.id;
              const signed = c.expiry_state === "signed";
              return (
                <article key={c.id} className="ct-row-card">
                  <div className="ct-row-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                      <path
                        d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
                        stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"
                      />
                      <path
                        d="M14 3v4h4M9 12h6M9 15.5h6"
                        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div className="ct-row-main">
                    <div className="ct-row-top">
                      <div>
                        <h3 className="ct-row-title">{c.title}</h3>
                        <p className="ct-row-brand">
                          Brand: <strong>{c.brand_name}</strong>
                        </p>
                      </div>
                      <span className={`ct-pill ct-pill-${info.tone}`}>{info.label}</span>
                    </div>
                    <div className="ct-row-meta">
                      <span>Uploaded: <strong>{formatShortDate(c.created_at)}</strong></span>
                      <span>Expires: <strong>{formatFullDate(c.expires_at)}</strong></span>
                      {days !== null && c.expiry_state !== "signed" && (
                        <span className={days < 0 ? "ct-overdue" : ""}>
                          {days < 0 ? `Expired ${Math.abs(days)}d ago` : days === 0 ? "Expires today" : `Expires in ${days}d`}
                        </span>
                      )}
                    </div>
                    <div className="ct-row-actions">
                      {c.file_url && (
                        <>
                          <button className="ct-btn ct-btn-primary" disabled={busy}
                            onClick={() => window.open(c.file_url, "_blank", "noopener")}>
                            View
                          </button>
                          <a className="ct-btn ct-btn-link" href={c.file_url}
                            download={c.file_name || "contract"} target="_blank" rel="noreferrer">
                            Download
                          </a>
                        </>
                      )}
                      <button className="ct-btn" disabled={busy} onClick={() => openForDeal(c)}>
                        {c.file_url ? "Replace" : "Upload"}
                      </button>
                      {!signed ? (
                        <button className="ct-btn ct-btn-success" disabled={busy}
                          onClick={() => handleStatus(c, "signed")}>
                          {busy ? "Saving…" : "Mark signed"}
                        </button>
                      ) : (
                        <button className="ct-btn" disabled={busy}
                          onClick={() => handleStatus(c, "awaiting_signature")}>
                          {busy ? "Saving…" : "Mark awaiting signature"}
                        </button>
                      )}
                      <button className="ct-btn ct-btn-danger" disabled={busy}
                        onClick={() => handleRemove(c)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <p className="ct-fineprint ct-fineprint-page">
          Signature status is creator-marked tracking only — Brandio does not
          provide legal e-signatures.
        </p>
      </div>

      {modalState && (
        <ContractUploadModal
          deal={modalState.deal}
          existing={modalState.existing}
          onClose={() => setModalState(null)}
          onSaved={handleSaved}
          showToast={showToast}
        />
      )}
    </div>
  );
}


