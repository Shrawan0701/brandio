import { useState } from "react";
import { uploadContractFile } from "../lib/api";

/* =========================================================
   CONTRACT UPLOAD MODAL · attach / replace a deal's contract
   ========================================================= */

const ACCEPT = ".pdf,.doc,.docx,.png,.jpg,.jpeg";

export default function ContractUploadModal({
  deal,
  existing,
  onClose,
  onSaved,
  showToast
}) {
  const [title, setTitle] = useState(
    existing?.title || (deal ? `${deal.brand_name} — Contract` : "Contract")
  );
  const [expiresAt, setExpiresAt] = useState(
    existing?.expires_at ? String(existing.expires_at).slice(0, 10) : ""
  );
  const [notes, setNotes] = useState(existing?.notes || "");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!title.trim()) {
      showToast?.("Give the contract a title", "error");
      return;
    }
    try {
      setSaving(true);
      let fileUrl = existing?.file_url || null;
      let fileName = existing?.file_name || null;
      if (file) {
        const uploaded = await uploadContractFile(file);
        fileUrl = uploaded.url;
        fileName = uploaded.name;
      }
      await onSaved({
        title: title.trim().slice(0, 150),
        expires_at: expiresAt || null,
        notes: notes.trim() || null,
        file_url: fileUrl,
        file_name: fileName
      });
    } catch (err) {
      showToast?.(err.message || "Could not save contract", "error");
      setSaving(false);
    }
  };

  return (
    <div className="ct-overlay" onClick={onClose}>
      <div className="ct-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="ct-modal-title">
          {existing ? "Replace contract" : "Upload contract"}
        </h3>
        <p className="ct-modal-sub">
          {deal ? `Attach paperwork to the ${deal.brand_name} deal.` : ""}
        </p>

        <label className="ct-label">Contract title</label>
        <input
          className="ct-input"
          value={title}
          maxLength={150}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nike — Q4 Collaboration Agreement"
        />

        <div className="ct-row">
          <div className="ct-col">
            <label className="ct-label">Expiration date</label>
            <input
              type="date"
              className="ct-input"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <div className="ct-col">
            <label className="ct-label">Document (PDF, DOC, image)</label>
            <label className="ct-file-btn">
              {file ? file.name.slice(0, 28) : "Choose file"}
              <input
                type="file"
                accept={ACCEPT}
                hidden
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
        </div>

        <label className="ct-label">Notes</label>
        <textarea
          className="ct-input ct-textarea"
          value={notes}
          maxLength={2000}
          rows={3}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Payment terms, usage rights, contact…"
        />

        <div className="ct-modal-actions">
          <button className="ct-btn" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="ct-btn ct-btn-primary"
            onClick={submit}
            disabled={saving}
          >
            {saving ? "Saving…" : existing ? "Save contract" : "Attach contract"}
          </button>
        </div>
      </div>
    </div>
  );
}
