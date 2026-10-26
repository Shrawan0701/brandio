import { WorkspaceHeader } from "../components/WorkspaceUI";
import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { analyzeDealTerms, extractDealAnalyzerFile, fetchDeals, updateDeal } from "../lib/api";
import { formatMoney, num } from "../utils/deals";
import { useToast } from "../components/ToastProvider";

const sectionLabels = {
  deliverables: "Deliverables",
  payment: "Payment",
  usage: "Usage",
  exclusivity: "Exclusivity",
  performance: "Performance requirements",
  cancellation: "Cancellation",
  disclosure: "Disclosure and compliance",
  important_dates: "Important dates",
  potential_negotiation_points: "Potential negotiation points",
  missing_or_unclear_information: "Missing/unclear information"
};

export default function DealAnalyzer() {
  const { showToast } = useToast();
  const [text, setText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [fields, setFields] = useState({});
  const [selectedFields] = useState({
    deal_value: true,
    currency: true,
    deliverables: true,
    posting_dates: true,
    payment_due_date: true,
    usage_rights: true,
    paid_advertising_rights: true,
    whitelisting: true,
    exclusivity: true,
    revision_requirements: true
  });
  const [deals, setDeals] = useState([]);
  const [dealId, setDealId] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDeals().then((data) => setDeals(data.deals || [])).catch(() => {});
  }, []);

  const selectedDeal = useMemo(() => deals.find((deal) => String(deal.id) === String(dealId)), [dealId, deals]);

  const analyze = async () => {
    setLoading(true);
    setError("");
    setProgress("Reading deal terms...");
    try {
      setProgress("Extracting business terms...");
      const result = await analyzeDealTerms(text);
      setAnalysis(result);
      setFields(result.extracted_fields || {});
      setProgress("Analysis complete");
    } catch (err) {
      setError(err.response?.data?.message || "Could not analyze deal terms");
      setProgress("");
    } finally {
      setLoading(false);
    }
  };

  const readFile = async (file) => {
    if (!file) return;
    setError("");
    setAnalysis(null);
    setFields({});
    setProgress(`Reading ${file.name}...`);
    try {
      if (/\.(txt|md|csv|rtf)$/i.test(file.name)) {
        setText(await file.text());
      } else {
        const result = await extractDealAnalyzerFile(file);
        setText(result.text || "");
      }
      setProgress("File loaded");
    } catch (err) {
      setError(err.response?.data?.message || "Could not read this file");
      setProgress("");
    }
  };

  const payloadFromSelected = () => {
    const payload = {};
    const notes = [];

    if (selectedFields.deal_value && fields.deal_value) payload.amount = num(fields.deal_value);
    if (selectedFields.currency && fields.currency) payload.currency = /^(\$|USD)$/i.test(fields.currency) ? "$" : "₹";
    if (selectedFields.deliverables && fields.deliverables) notes.push(`Deliverables:\n${fields.deliverables}`);
    if (selectedFields.usage_rights && fields.usage_rights) notes.push(`Usage rights:\n${fields.usage_rights}`);
    if (selectedFields.paid_advertising_rights && fields.paid_advertising_rights) notes.push(`Paid advertising:\n${fields.paid_advertising_rights}`);
    if (selectedFields.whitelisting && fields.whitelisting) notes.push(`Whitelisting:\n${fields.whitelisting}`);
    if (selectedFields.exclusivity && fields.exclusivity) notes.push(`Exclusivity:\n${fields.exclusivity}`);
    if (selectedFields.revision_requirements && fields.revision_requirements) notes.push(`Revisions:\n${fields.revision_requirements}`);
    if (selectedFields.payment_due_date && /^\d{4}-\d{2}-\d{2}$/.test(fields.payment_due_date || "")) {
      payload.payment_due_date = fields.payment_due_date;
    }
    if (selectedFields.posting_dates && /^\d{4}-\d{2}-\d{2}$/.test(fields.posting_dates || "")) {
      payload.posting_date = fields.posting_dates;
    }
    if (notes.length) {
      const existingNotes = String(selectedDeal?.notes || "").trim();
      const extractedNotes = `Analyzer review:\n${notes.join("\n\n")}`;
      if (!existingNotes.includes(extractedNotes)) payload.notes = [existingNotes, extractedNotes].filter(Boolean).join("\n\n");
    }
    return payload;
  };

  const applyToDeal = async () => {
    if (!dealId) return showToast("Choose a deal first", "error");
    if (fields.currency && !/^(₹|INR|Rs\.?|\$|USD)$/i.test(fields.currency)) {
      return showToast("This deal currency is not supported. Review the amount before applying.", "error");
    }
    const payload = payloadFromSelected();
    if (!Object.keys(payload).length) return showToast("Select at least one usable field", "error");
    try {
      await updateDeal(dealId, payload);
      showToast("Selected fields applied to deal", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Could not update deal", "error");
    }
  };

  const usefulSections = analysis
    ? Object.entries(sectionLabels)
        .map(([key, label]) => ({ key, label, items: analysis.sections?.[key] || [] }))
        .filter((section) => section.items.length && section.key !== "missing_or_unclear_information")
    : [];
  const missingItems = analysis?.sections?.missing_or_unclear_information || [];

  return (
    <div className="da-page workspace-page">
      <Helmet><title>AI Deal Analyzer - Brandio</title></Helmet>

      <WorkspaceHeader eyebrow="Intelligence / Deal analyzer" title="Deal analyzer" description="Upload an agreement or paste its terms to review deliverables, payment, usage, and important dates." />

      <main className="da-layout">
        <section className="da-panel da-input">
          <div className="da-panel-head">
            <h2>Contract or deal terms</h2>
            <label className="da-upload">
              Upload file
              <input type="file" aria-label="Upload deal terms" accept=".pdf,.doc,.docx,.txt,.md,.csv,.rtf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => readFile(e.target.files?.[0])} />
            </label>
          </div>
          <textarea
            aria-label="Contract or deal terms"
            value={text}
            onChange={(e) => { setText(e.target.value); setAnalysis(null); setFields({}); setProgress(""); }}
            placeholder="Paste contract clauses, deal terms, email agreement, or brand brief text here..."
          />
          {error && <div className="da-error" role="alert">{error}</div>}
          {progress && <div className="da-progress" role="status">{progress}</div>}
          <button className="da-primary" disabled={loading || text.trim().length < 40} onClick={analyze}>
            {loading ? "Analyzing..." : "Analyze deal terms"}
          </button>
        </section>

        <section className="da-panel da-summary">
          <h2>Deal Summary</h2>
          {analysis ? (
            <>
              <p>{analysis.deal_summary}</p>
              <div className="da-summary-grid">
                <div><span>Deal value</span><strong>{fields.deal_value ? displayMoney(fields.deal_value, fields.currency) : "Needs review"}</strong></div>
                <div><span>Review method</span><strong>{analysis.source === "ai" ? "AI-assisted review" : "Rules-based review"}</strong></div>
              </div>
              {!!analysis.sections?.potential_negotiation_points?.length && <div className="da-summary-flags"><strong>Terms to review</strong><ul>{analysis.sections.potential_negotiation_points.slice(0, 3).map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
              <small>{analysis.disclaimer}</small>
            </>
          ) : (
            <div className="da-empty">Analysis output will appear here.</div>
          )}
        </section>
      </main>

      {analysis && (
        <>
          <section className="da-sections">
            {usefulSections.map(({ key, label, items }) => (
              <div className="da-panel" key={key}>
                <h3>{label}</h3>
                <ul>
                  {items.map((item, index) => <li key={`${key}-${index}`}>{item}</li>)}
                </ul>
              </div>
            ))}
            {missingItems.length > 0 && (
              <div className="da-panel da-missing">
                <h3>Missing or unclear</h3>
                <p className="da-muted">Review these points before applying terms to a deal.</p>
                <ul>
                  {missingItems.map((item, index) => <li key={`missing-${index}`}>{item}</li>)}
                </ul>
              </div>
            )}
          </section>

          <section className="da-panel da-apply">
            <div>
              <h2>Apply detected fields to a deal</h2>
              <p>Review the amount, currency, dates and notes above before applying them.</p>
            </div>
            <select aria-label="Apply terms to deal" value={dealId} onChange={(e) => setDealId(e.target.value)}>
              <option value="">Choose existing deal</option>
              {deals.map((deal) => (
                <option key={deal.id} value={deal.id}>{deal.brand_name} • {deal.platform}</option>
              ))}
            </select>
            {selectedDeal && <span>Selected: {selectedDeal.brand_name}</span>}
            <button onClick={applyToDeal}>Apply detected fields</button>
          </section>
        </>
      )}
    </div>
  );
}

function displayMoney(value, currency) {
  if (currency === "₦" || currency === "NGN") {
    return `₦${num(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  }
  return formatMoney(value, currency);
}
