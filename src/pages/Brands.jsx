import { WorkspaceHeader, WorkspaceStats, WorkspaceSearch } from "../components/WorkspaceUI";
import { Fragment, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { fetchBrandRelationships } from "../lib/api";
import { formatMoney } from "../utils/deals";

export default function Brands() {
  const [brands, setBrands] = useState([]);
  const [totals, setTotals] = useState({});
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const visibleBrands = brands.filter((brand) => brand.brand?.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    fetchBrandRelationships()
      .then((data) => {
        setBrands(data.brands || []);
        setTotals(data.totals || {});
        setSelected((data.brands || [])[0] || null);
      })
      .catch(() => setError("Could not load brand relationships"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="brand-crm-page workspace-page"><div className="brand-empty">Loading brand relationships...</div></div>;
  if (error) return <div className="brand-crm-page workspace-page"><div className="brand-empty">{error}</div></div>;

  return (
    <div className="brand-crm-page workspace-page">
      <Helmet><title>Brand CRM - Brandio</title></Helmet>

      <WorkspaceHeader eyebrow="Main / Brands" title="Brand relationships" description="Your collaboration history, payment patterns, and brand conversations in one place." />
      <WorkspaceStats items={[
        { label: "Brands", value: totals.brands || 0, note: "Recorded relationships", icon: "brands" },
        { label: "Repeat brands", value: totals.repeat_brands || 0, note: "More than one collaboration", icon: "check", tone: "green" },
        { label: "Active relationships", value: totals.active_brand_relationships || 0, note: "Brand work in progress", icon: "deals", tone: "blue" },
        { label: "Payment history", value: totals.with_payment_history || 0, note: "Brands with recorded payments", icon: "money", tone: "amber" }
      ]} />

      {brands.length === 0 ? (
        <div className="brand-empty">Add deals to build brand relationship history.</div>
      ) : (
        <main className="brand-crm-layout">
          <section className="brand-list">
            <div className="ws-list-heading"><h2>Your brands</h2><span>{brands.length} relationships</span></div>
            <WorkspaceSearch label="Search brands" placeholder="Find a brand" value={query} onChange={(event) => setQuery(event.target.value)} />
            {!visibleBrands.length && <p className="brand-muted">No brands match your search.</p>}
            {visibleBrands.map((brand) => (
              <Fragment key={brand.brand}>
                <button
                  className={selected?.brand === brand.brand ? "active" : ""}
                  aria-pressed={selected?.brand === brand.brand}
                  onClick={() => setSelected(brand)}
                >
                  <div>
                    <strong>{brand.brand}</strong>
                    <span>{brand.total_deals} collaboration{brand.total_deals === 1 ? "" : "s"}</span>
                  </div>
                  <div className="brand-list-meta">
                    <em>{formatCurrencyAmounts(brand.revenue_by_currency)}</em>
                    <span className="brand-open-label">{selected?.brand === brand.brand ? "Open" : "View"}</span>
                  </div>
                </button>
                {selected?.brand === brand.brand && (
                  <div className="brand-mobile-detail">
                    <BrandWorkspace brand={selected} />
                  </div>
                )}
              </Fragment>
            ))}
          </section>

          {selected && (
            <div className="brand-desktop-detail">
              <BrandWorkspace brand={selected} />
            </div>
          )}
        </main>
      )}
    </div>
  );
}

function BrandWorkspace({ brand }) {
  return (
    <section className="brand-workspace">
      <div className="brand-workspace-head">
        <div>
          <h2>{brand.brand}</h2>
          <p>Relationship overview from recorded Brandio activity.</p>
        </div>
        <div className="brand-indicators">
          {(brand.indicators || []).map((indicator) => <span key={indicator}>{indicator}</span>)}
        </div>
      </div>

      <div className="brand-metric-grid">
        <Metric label="Total deals" value={brand.total_deals} />
        <Metric label="Total recorded revenue" value={formatCurrencyAmounts(brand.revenue_by_currency)} />
        <Metric label="Average deal value" value={formatCurrencyAmounts(brand.average_by_currency)} />
        <Metric label="Completed campaigns" value={brand.completed_campaigns} />
        <Metric label="Payment timing" value={brand.average_payment_days === null ? "No data" : `${brand.average_payment_days} days`} />
        <Metric label="Number of revisions" value={brand.revisions} />
        <Metric label="Repeat collaborations" value={brand.repeat_collaborations} />
        <Metric label="Active deals" value={brand.active_deals} />
        <Metric label="Last collaboration" value={formatDate(brand.last_collaboration_at)} />
        <Metric label="Last contact" value={formatDate(brand.last_contact_at)} note={brand.last_contact_source || ""} />
      </div>

      <div className="brand-workspace-grid">
        <div className="brand-panel">
          <h3>Deal history</h3>
          {brand.deals.map((deal) => (
            <div className="brand-row" key={deal.id}>
              <div>
                <strong>{deal.platform || "Platform"}</strong>
                <span>{deal.status} • {formatDate(deal.posting_date)}</span>
              </div>
              <em>{formatMoney(deal.revenue, deal.currency)}</em>
            </div>
          ))}
          {brand.deals.length === 0 && <p className="brand-muted">No deals recorded for this brand yet.</p>}
        </div>

        <div className="brand-panel">
          <h3>Inbound contact history</h3>
          {brand.inquiries.map((inquiry, index) => (
            <div className="brand-row" key={`${inquiry.email}-${index}`}>
              <div>
                <strong>{inquiry.contact || "Contact"}</strong>
                <span>{inquiry.status} • {formatDate(inquiry.created_at)}</span>
              </div>
              <em>{inquiry.email}</em>
            </div>
          ))}
          {brand.inquiries.length === 0 && <p className="brand-muted">No inbound inquiries recorded for this brand.</p>}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return <div><strong>{value}</strong><span>{label}</span></div>;
}

function Metric({ label, value, note }) {
  return (
    <div className="brand-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "No data";
  return new Date(value).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function formatCurrencyAmounts(amounts = {}) {
  const entries = Object.entries(amounts);
  return entries.length ? entries.map(([currency, value]) => formatMoney(value, currency)).join(" · ") : formatMoney(0);
}
