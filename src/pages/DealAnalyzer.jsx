import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { analyzeDealTerms, fetchDeals, updateDeal } from "../lib/api";
import { formatMoney, num } from "../utils/deals";
import { useToast } from "../components/ToastProvider";

const fieldLabels = {
  deal_value: "Deal value",
  currency: "Currency",
  deliverables: "Deliverables",
  posting_dates: "Posting dates",
  payment_terms: "Payment terms",
  payment_due_date: "Payment due date",
  usage_rights: "Usage rights",
  paid_advertising_rights: "Paid advertising rights",
  whitelisting: "Whitelisting",
  exclusivity: "Exclusivity",
  exclusivity_duration: "Exclusivity duration",
  revision_requirements: "Revision requirements",
  cancellation_terms: "Cancellation terms",
  content_ownership: "Content ownership",
  raw_footage_requirements: "Raw footage requirements",
  approval_process: "Approval process"
};

const sectionLabels = {
  deliverables: "Deliverables",
  payment: "Payment",
  usage: "Usage",
  exclusivity: "Exclusivity",
  important_dates: "Important dates",
  potential_negotiation_points: "Potential negotiation points",
  missing_or_unclear_information: "Missing/unclear information"
};

export default function DealAnalyzer() {
  const { showToast } = useToast();
  const [text, setText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [fields, setFields] = useState({});
  const [selectedFields, setSelectedFields] = useState({
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

  const selectedDeal = useMemo(() => deals.find((deal) => deal.id === dealId), [dealId, deals]);

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
    const content = await file.text();
    setText(content);
  };

  const updateField = (key, value) => setFields((prev) => ({ ...prev, [key]: value }));
  const toggleField = (key) => setSelectedFields((prev) => ({ ...prev, [key]: !prev[key] }));

  const payloadFromSelected = () => {
    const payload = {};
    const notes = [];

    if (selectedFields.deal_value && fields.deal_value) payload.amount = num(fields.deal_value);
    if (selectedFields.currency && fields.currency) payload.currency = fields.currency === "$" ? "$" : "₹";
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
    if (notes.length) payload.notes = notes.join("\n\n");
    return payload;
  };

  const applyToDeal = async () => {
    if (!dealId) return showToast("Choose a deal first", "error");
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
    <div className="da-page">
      <Helmet><title>AI Deal Analyzer - Brandio</title></Helmet>

      <header className="da-hero">
        <div>
          <span>AI Deal Analyzer</span>
          <h1>Extract the business terms before you sign.</h1>
          <p>Paste deal terms or upload a text file. Brandio highlights useful business information without giving legal advice.</p>
        </div>
      </header>

      <main className="da-layout">
        <section className="da-panel da-input">
          <div className="da-panel-head">
            <h2>Contract or deal terms</h2>
            <label className="da-upload">
              Upload text
              <input type="file" accept=".txt,.md,.csv,.rtf" hidden onChange={(e) => readFile(e.target.files?.[0])} />
            </label>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste contract clauses, deal terms, email agreement, or brand brief text here..."
          />
          {error && <div className="da-error">{error}</div>}
          {progress && <div className="da-progress">{progress}</div>}
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
                <div><span>Detected value</span><strong>{fields.deal_value ? formatMoney(fields.deal_value, fields.currency) : "Not detected"}</strong></div>
                <div><span>Source</span><strong>{analysis.source === "ai" ? "OpenAI extraction" : "Rules fallback"}</strong></div>
              </div>
              <small>{analysis.disclaimer}</small>
            </>
          ) : (
            <div className="da-empty">Analysis output will appear here.</div>
          )}
        </section>
      </main>

      {analysis && (
        <>
          <section className="da-panel da-fields">
            <div className="da-panel-head">
              <h2>Review extracted data</h2>
              <p>Edit anything before applying it to a deal.</p>
            </div>
            <div className="da-field-grid">
              {Object.keys(fieldLabels).map((key) => (
                <label key={key} className="da-field">
                  <span>
                    <input type="checkbox" checked={selectedFields[key] === true} onChange={() => toggleField(key)} />
                    {fieldLabels[key]}
                  </span>
                  <textarea value={fields[key] || ""} onChange={(e) => updateField(key, e.target.value)} />
                </label>
              ))}
            </div>
          </section>

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
              <h2>Apply selected fields to a deal</h2>
              <p>Only selected fields are applied. Review everything first.</p>
            </div>
            <select value={dealId} onChange={(e) => setDealId(e.target.value)}>
              <option value="">Choose existing deal</option>
              {deals.map((deal) => (
                <option key={deal.id} value={deal.id}>{deal.brand_name} • {deal.platform}</option>
              ))}
            </select>
            {selectedDeal && <span>Selected: {selectedDeal.brand_name}</span>}
            <button onClick={applyToDeal}>Apply selected fields</button>
          </section>
        </>
      )}
    </div>
  );
}
