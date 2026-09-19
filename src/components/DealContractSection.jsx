import { useCallback, useEffect, useState } from "react";
import { useToast } from "./ToastProvider";
import ContractCard from "./ContractCard";
import ContractUploadModal from "./ContractUploadModal";
import {
  attachContract,
  deleteContract,
  fetchDealContract,
  setContractStatus,
  updateContract
} from "../lib/api";

/* =========================================================
   DEAL CONTRACT SECTION · Contracts area inside the Deal
   Workspace (one contract per deal). Reuses the shared
   ContractCard viewer + upload modal.
   ========================================================= */

export default function DealContractSection({ deal }) {
  const { showToast } = useToast();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    if (!deal?.id) return;
    try {
      setLoading(true);
      const data = await fetchDealContract(deal.id);
      setContract(data);
    } catch (err) {
      if (err.response?.status !== 404) {
        showToast("Could not load contract", "error");
      }
      setContract(null);
    } finally {
      setLoading(false);
    }
  }, [deal?.id, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaved = async (payload) => {
    try {
      const saved = contract
        ? await updateContract(contract.id, payload)
        : await attachContract(deal.id, payload);
      setContract(saved);
      setModalOpen(false);
      showToast(contract ? "Contract updated" : "Contract attached");
    } catch (err) {
      showToast(err.response?.data?.message || "Could not save contract", "error");
    }
  };

  const handleStatus = async (status) => {
    if (!contract) return;
    try {
      setBusy(true);
      const updated = await setContractStatus(contract.id, status);
      setContract(updated);
      showToast(
        status === "signed" ? "Marked as signed" : "Marked as awaiting signature"
      );
    } catch {
      showToast("Could not update status", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!contract) return;
    if (!window.confirm("Remove this contract from the deal?")) return;
    try {
      setBusy(true);
      await deleteContract(contract.id);
      setContract(null);
      showToast("Contract removed");
    } catch {
      showToast("Could not remove contract", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ct-section">
      <div className="ct-section-head">
        <div>
          <h3 className="ct-section-title">Contract</h3>
          <p className="ct-section-sub">
            Keep the deal paperwork attached — status tracking only.
          </p>
        </div>
        {!loading && !contract && (
          <button className="ct-btn ct-btn-primary" onClick={() => setModalOpen(true)}>
            Upload
          </button>
        )}
      </div>

      {loading && <div className="ct-muted">Loading contract…</div>}

      {!loading && !contract && (
        <button className="ct-empty" onClick={() => setModalOpen(true)}>
          <span className="ct-empty-icon">＋</span>
          <span className="ct-empty-title">No contract attached</span>
          <span className="ct-empty-sub">
            Upload the agreement for {deal?.brand_name || "this deal"} so it is
            always one click away.
          </span>
        </button>
      )}

      {!loading && contract && (
        <ContractCard
          contract={contract}
          busy={busy}
          onView={() => window.open(contract.file_url, "_blank", "noopener")}
          onDownload={() => {
            const a = document.createElement("a");
            a.href = contract.file_url;
            a.download = contract.file_name || "contract";
            a.target = "_blank";
            document.body.appendChild(a);
            a.click();
            a.remove();
          }}
          onReplace={() => setModalOpen(true)}
          onMarkSigned={() => handleStatus("signed")}
          onMarkAwaiting={() => handleStatus("awaiting_signature")}
          onRemove={handleRemove}
        />
      )}

      {modalOpen && (
        <ContractUploadModal
          deal={deal}
          existing={contract}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
          showToast={showToast}
        />
      )}
    </div>
  );
}
