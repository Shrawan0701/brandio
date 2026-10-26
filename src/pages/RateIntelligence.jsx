import { WorkspaceHeader } from "../components/WorkspaceUI";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { calculateRateQuote, fetchRateQuotes, saveRateQuote } from "../lib/api";
import { formatMoney, num } from "../utils/deals";
import AddDealModal from "../components/AddDealModal";
import { useToast } from "../components/ToastProvider";

const initial = {
  platform: "Instagram",
  followers: "",
  average_views: "",
  engagement_rate: "",
  deliverables: "1",
  content_type: "paid",
  usage_rights: "Organic only",
  paid_ad_usage: false,
  exclusivity: false,
  turnaround: "Standard",
  brand_name: "",
  currency: "INR"
};

export default function RateIntelligence() {
  const { showToast } = useToast();
  const [form, setForm] = useState(initial);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dealSeed, setDealSeed] = useState(null);

  useEffect(() => {
    fetchRateQuotes().then((data) => setQuotes(data.quotes || [])).catch(() => {});
  }, []);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const calculate = async () => {
    setLoading(true);
    try {
      const data = await calculateRateQuote({
        ...form,
        followers: num(form.followers),
        average_views: num(form.average_views),
        engagement_rate: num(form.engagement_rate),
        deliverables: num(form.deliverables)
      });
      setResult(data);
      setMessage(data.ai?.negotiation_message || "");
    } catch {
      showToast("Could not calculate quote", "error");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!result) return;
    try {
      const saved = await saveRateQuote({
        input: result.input,
        result,
        negotiation_message: message
      });
      setQuotes((prev) => [saved, ...prev]);
      showToast("Quote saved", "success");
    } catch {
      showToast("Could not save quote", "error");
    }
  };

  const addToDeal = () => {
    if (!result) return;
    setDealSeed({
      brand_name: form.brand_name || "",
      platform: form.platform || "Instagram",
      deal_type: form.content_type || "paid",
      currency: result.currency === "USD" ? "$" : "₹",
      amount: result.suggested_range?.high || "",
      fixed_amount: result.suggested_range?.high || "",
      deliverable_count: form.deliverables || 0,
      notes: `Rate Intelligence quote\nSuggested range: ${formatMoney(result.suggested_range?.low, result.currency)} - ${formatMoney(result.suggested_range?.high, result.currency)}\n\n${message}`
    });
  };

  return (
    <div className="rate-page workspace-page">
      <Helmet><title>Rate Intelligence - Brandio</title></Helmet>

      <WorkspaceHeader eyebrow="Intelligence / Rates" title="Rate intelligence" description="Build a planning quote from comparable deals in your own Brandio history." />

      <main className="rate-layout">
        <section className="rate-panel rate-form">
          <h2>Campaign inputs</h2>
          <div className="rate-input-grid">
            <Select label="Platform" value={form.platform} onChange={(v) => update("platform", v)} options={["Instagram", "YouTube", "TikTok", "X", "Other"]} />
            <Select label="Currency" value={form.currency} onChange={(v) => update("currency", v)} options={["INR", "USD"]} />
            <Input label="Followers" value={form.followers} onChange={(v) => update("followers", v)} />
            <Input label="Average views" value={form.average_views} onChange={(v) => update("average_views", v)} />
            <Input label="Engagement rate %" value={form.engagement_rate} onChange={(v) => update("engagement_rate", v)} />
            <Input label="Deliverables" value={form.deliverables} onChange={(v) => update("deliverables", v)} />
            <Select label="Content type" value={form.content_type} onChange={(v) => update("content_type", v)} options={["paid", "affiliate", "commission", "hybrid"]} />
            <Select label="Usage rights" value={form.usage_rights} onChange={(v) => update("usage_rights", v)} options={["Organic only", "3 months usage", "6 months usage", "12 months usage", "Perpetual usage"]} />
            <Select label="Turnaround" value={form.turnaround} onChange={(v) => update("turnaround", v)} options={["Standard", "Rush"]} />
            <Input label="Brand name" value={form.brand_name} onChange={(v) => update("brand_name", v)} />
          </div>
          <div className="rate-checks">
            <label><input type="checkbox" checked={form.paid_ad_usage} onChange={(e) => update("paid_ad_usage", e.target.checked)} /> Paid advertising usage</label>
            <label><input type="checkbox" checked={form.exclusivity} onChange={(e) => update("exclusivity", e.target.checked)} /> Exclusivity</label>
          </div>
          <button className="rate-primary" onClick={calculate} disabled={loading}>{loading ? "Calculating..." : "Calculate"}</button>
        </section>

        <section className="rate-panel rate-result">
          <h2>Suggested quote range</h2>
          {result ? (
            <>
              <div className="rate-range">
                <strong>{formatMoney(result.suggested_range.low, result.currency)} - {formatMoney(result.suggested_range.high, result.currency)}</strong>
                <span>{result.disclaimer}</span>
              </div>
              <div className="rate-historical">
                <Metric label="Comparable range" value={`${formatMoney(result.historical.low, result.currency)} - ${formatMoney(result.historical.high, result.currency)}`} />
                <Metric label="Average deal value" value={formatMoney(result.historical.average, result.currency)} />
                <Metric label="Median deal value" value={formatMoney(result.historical.median, result.currency)} />
                <Metric label="Highest deal value" value={formatMoney(result.historical.highest, result.currency)} />
              </div>
              <p className="rate-explain">{result.ai?.explanation}</p>
              <p className="rate-explain">{result.ai?.negotiation_considerations}</p>
              <label className="rate-message">
                Negotiation message
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} />
              </label>
              <div className="rate-actions">
                <button onClick={save}>Save quote</button>
                <button onClick={addToDeal}>Add to deal</button>
              </div>
            </>
          ) : (
            <div className="rate-empty">Enter campaign details and calculate a planning range.</div>
          )}
        </section>
      </main>

      {result && (
        <section className="rate-panel rate-comparables">
          <h2>Historical comparable deals</h2>
          <div className="rate-table">
            {result.comparables.map((deal) => (
              <div key={deal.id}>
                <strong>{deal.brand_name}</strong>
                <span>{deal.platform}</span>
                <span>{deal.deliverable_count || 0} deliverables</span>
                <span>Similarity {deal.similarity_score}</span>
                <em>{formatMoney(deal.revenue, result.currency)}</em>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rate-panel rate-saved">
        <h2>Saved quotes</h2>
        {quotes.length === 0 && <p className="rate-empty">No saved quotes yet.</p>}
        {quotes.map((quote) => (
          <button key={quote.id} onClick={() => {
            setResult(quote.quote_result);
            setForm({ ...initial, ...(quote.quote_inputs || {}) });
            setMessage(quote.negotiation_message || quote.quote_result?.ai?.negotiation_message || "");
          }}>
            <span>{quote.quote_inputs?.platform || "Quote"}</span>
            <strong>{formatMoney(quote.quote_result?.suggested_range?.low, quote.quote_result?.currency || quote.quote_inputs?.currency)} - {formatMoney(quote.quote_result?.suggested_range?.high, quote.quote_result?.currency || quote.quote_inputs?.currency)}</strong>
          </button>
        ))}
      </section>

      {dealSeed && (
        <AddDealModal
          onClose={() => setDealSeed(null)}
          onCreated={() => {
            setDealSeed(null);
            showToast("Deal created from quote", "success");
          }}
          totalDeals={0}
          initialData={dealSeed}
        />
      )}
    </div>
  );
}

function Input({ label, value, onChange }) {
  return <label>{label}<input value={value} onChange={(e) => onChange(e.target.value)} /></label>;
}

function Select({ label, value, onChange, options }) {
  return <label>{label}<select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o}>{o}</option>)}</select></label>;
}

function Metric({ label, value }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}
