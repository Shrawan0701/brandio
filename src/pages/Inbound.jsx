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
  const [stats, setStats] = useState({});
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
      setStats(data.stats || {});
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
    new: stats.new || 0,
    reviewing: stats.reviewing || 0,
    negotiating: stats.negotiating || 0,
    converted: stats.converted || 0,
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
    <div className="inb-page">
      <Helmet><title>Inbound - Brandio</title></Helmet>
      <div className="inb-shell">
        <header className="inb-head">
          <div>
            <h1>Inbound</h1>
            <p>Review brand collaboration requests before they become deals.</p>
            {(user?.public_slug || user?.username) && (
              <div className="inb-link">Work With Me: /{user.public_slug || user.username}/work-with-me</div>
            )}
          </div>
          <div className="inb-stats">
            <Stat label="New inquiries" value={stats.new || 0} />
            <Stat label="Reviewing" value={stats.reviewing || 0} />
            <Stat label="Negotiating" value={stats.negotiating || 0} />
            <Stat label="Converted" value={stats.converted || 0} />
          </div>
        </header>

        <div className="inb-filters">
          {FILTERS.map((f) => (
            <button key={f.id} className={filter === f.id ? "active" : ""} onClick={() => setFilter(f.id)}>
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
          plan="pro"
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

function Stat({ label, value }) {
  return <div><strong>{value}</strong><span>{label}</span></div>;
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
      <div className="inb-modal">
        <button className="modal-close" onClick={onClose}>x</button>
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
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Creator notes" />
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
