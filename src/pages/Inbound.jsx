import { WorkspaceHeader, WorkspaceStats, WorkspaceIcon } from "../components/WorkspaceUI";
import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../context/AuthContext";
import { fetchInboundInquiries, updateInboundInquiry } from "../lib/api";
import AddDealModal from "../components/AddDealModal";
import { useToast } from "../components/ToastProvider";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "reviewing", label: "Reviewing" },
  { id: "negotiating", label: "Negotiating" },
  { id: "converted", label: "Converted" },
  { id: "archived", label: "Archived" }
];

const STATUS_LABELS = {
  new: "New",
  reviewing: "Reviewing",
  negotiating: "Negotiating",
  accepted: "Accepted",
  rejected: "Rejected",
  archived: "Archived"
};

export default function Inbound() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [inquiries, setInquiries] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [convertTarget, setConvertTarget] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchInboundInquiries();
      setInquiries(data.inquiries || []);
    } catch {
      setError("Could not load inbound inquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    if (filter === "all") return inquiries;
    if (filter === "converted") return inquiries.filter((i) => i.converted_deal_id);
    return inquiries.filter((i) => i.status === filter);
  }, [filter, inquiries]);

  const counts = {
    all: inquiries.length,
    new: inquiries.filter((i) => i.status === "new").length,
    reviewing: inquiries.filter((i) => i.status === "reviewing").length,
    negotiating: inquiries.filter((i) => i.status === "negotiating").length,
    converted: inquiries.filter((i) => i.converted_deal_id).length,
    archived: inquiries.filter((i) => i.status === "archived").length
  };

  const patchInquiry = async (inquiry, payload) => {
    const updated = await updateInboundInquiry(inquiry.id, payload);
    setInquiries((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    if (selected?.id === updated.id) setSelected(updated);
    return updated;
  };

  const prefill = (inquiry) => ({
    brand_name: inquiry.brand || "",
    platform: inquiry.platform || "Instagram",
    amount: "",
    currency: "₹",
    status: "pending",
    posting_date: "",
    payment_due_date: inquiry.deadline || "",
    deliverables: inquiry.deliverables || "",
    notes: [inquiry.campaign, inquiry.description, inquiry.usage_requirements]
      .filter(Boolean)
      .join("\n\n")
  });

  return (
    <div className="inb-page workspace-page">
      <Helmet><title>Inbound - Brandio</title></Helmet>
      <div className="inb-shell">
        <WorkspaceHeader eyebrow="Workspace / Inbound" title="Your collaboration inbox" description="Review brand requests and turn the right conversations into deals." actions={(user?.public_slug || user?.username) ? <a className="ws-button ws-secondary" href={`/${user.public_slug || user.username}/work-with-me`} target="_blank" rel="noopener noreferrer">View inquiry form <WorkspaceIcon name="arrow" /></a> : null} />
        <WorkspaceStats items={[
          { label: "New inquiries", value: counts.new, note: "Ready for a first look", icon: "inbox" },
          { label: "Reviewing", value: counts.reviewing, note: "Considering the fit", icon: "eye", tone: "blue" },
          { label: "Negotiating", value: counts.negotiating, note: "Conversations in progress", icon: "clock", tone: "amber" },
          { label: "Converted", value: counts.converted, note: "Now recorded as deals", icon: "check", tone: "green" }
        ]} />

        <div className="inb-filters">
          {FILTERS.map((f) => (
            <button key={f.id} className={filter === f.id ? "active" : ""} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}<span>{counts[f.id] || 0}</span>
            </button>
          ))}
        </div>

        {loading && <div className="inb-empty">Loading inquiries...</div>}
        {!loading && error && <div className="inb-empty">{error}</div>}
        {!loading && !error && visible.length === 0 && <div className="inb-empty">No inquiries in this view.</div>}

        {!loading && !error && visible.length > 0 && (
          <div className="inb-grid">
            {visible.map((inquiry) => (
              <article className="inb-card" key={inquiry.id}>
                <div className="inb-card-top">
                  <div>
                    <h3>{inquiry.brand}</h3>
                    <p>{inquiry.campaign_type || "Collaboration"} • {inquiry.platform || "Platform open"}</p>
                  </div>
                  <span>{inquiry.converted_deal_id ? "Converted" : STATUS_LABELS[inquiry.status]}</span>
                </div>
                <div className="inb-meta">
                  <span>{inquiry.budget || "Budget not set"}</span>
                  <span>{inquiry.deadline || "No deadline"}</span>
                </div>
                <p className="inb-desc">{inquiry.description || inquiry.deliverables || "No description provided."}</p>
                <div className="inb-actions">
                  <button onClick={() => setSelected(inquiry)}>View</button>
                  <button onClick={() => patchInquiry(inquiry, { status: "reviewing" })}>Reviewing</button>
                  <button onClick={() => patchInquiry(inquiry, { status: "negotiating" })}>Negotiating</button>
                  <button onClick={() => setConvertTarget(inquiry)} disabled={Boolean(inquiry.converted_deal_id)}>Convert</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <InquiryModal
          inquiry={selected}
          onClose={() => setSelected(null)}
          onSaveNotes={async (notes) => {
            await patchInquiry(selected, { notes });
            showToast("Notes saved", "success");
          }}
          onReject={() => patchInquiry(selected, { status: "rejected" })}
          onArchive={() => patchInquiry(selected, { status: "archived" })}
        />
      )}

      {convertTarget && (
        <AddDealModal
          onClose={() => setConvertTarget(null)}
          totalDeals={0}
          initialData={prefill(convertTarget)}
          onCreated={async (deal) => {
            await patchInquiry(convertTarget, { converted_deal_id: deal.id });
            setConvertTarget(null);
            showToast("Inquiry converted into a deal", "success");
          }}
        />
      )}
    </div>
  );
}

function InquiryModal({ inquiry, onClose, onSaveNotes, onReject, onArchive }) {
  const [notes, setNotes] = useState(inquiry.notes || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveNotes = async () => {
    try {
      setSaving(true);
      await onSaveNotes(notes);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop-custom">
      <div className="inb-modal" role="dialog" aria-modal="true" aria-label="Inquiry details">
        <button className="modal-close" aria-label="Close inquiry" onClick={onClose}>×</button>
        <h2>{inquiry.brand}</h2>
        <p className="inb-muted">{inquiry.contact} • {inquiry.email}</p>
        {inquiry.website && <p><a href={inquiry.website} target="_blank" rel="noreferrer">{inquiry.website}</a></p>}
        <dl>
          <dt>Campaign</dt><dd>{inquiry.campaign || inquiry.campaign_type || "Not specified"}</dd>
          <dt>Budget</dt><dd>{inquiry.budget || "Not specified"}</dd>
          <dt>Deliverables</dt><dd>{inquiry.deliverables || "Not specified"}</dd>
          <dt>Usage</dt><dd>{inquiry.usage_requirements || "Not specified"}</dd>
          <dt>Description</dt><dd>{inquiry.description || "Not specified"}</dd>
        </dl>
        <label className="inb-notes-label" htmlFor="inquiry-creator-notes">Your notes</label>
        <textarea id="inquiry-creator-notes" aria-label="Creator notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add context or your next steps…" />
        {saved && <div className="inb-save-confirm">Notes saved</div>}
        <div className="inb-actions">
          <button onClick={saveNotes} disabled={saving}>{saving ? "Saving..." : "Save notes"}</button>
          <button onClick={onReject}>Reject</button>
          <button onClick={onArchive}>Archive</button>
        </div>
      </div>
    </div>
  );
}
