import pool from "../config/db.js";

const MONEY_EXPR = `
  CASE
    WHEN COALESCE(deal_type, 'paid') IN ('gifted', 'barter') THEN 0
    WHEN COALESCE(deal_type, 'paid') IN ('affiliate', 'commission') THEN COALESCE(commission_earned, 0)
    WHEN COALESCE(deal_type, 'paid') = 'hybrid' THEN COALESCE(fixed_amount, amount, 0) + COALESCE(commission_earned, 0)
    ELSE COALESCE(amount, 0)
  END
`;

const normalizeBrand = (value) => String(value || "").trim().toLowerCase();

const daysBetween = (a, b) => {
  if (!a || !b) return null;
  const start = new Date(a);
  const end = new Date(b);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return Math.max(0, Math.round((end - start) / 86400000));
};

const indicatorsFor = (brand) => {
  const indicators = [];
  if (brand.total_deals > 1) indicators.push("Repeat brand");
  if (brand.days_since_last_collaboration !== null && brand.days_since_last_collaboration <= 90) {
    indicators.push("Recently active");
  }
  if (brand.payment_records > 0) indicators.push("Payment history available");
  else indicators.push("No payment history available");
  if (brand.active_deals > 0) indicators.push("Active deals");
  return indicators;
};

export const getBrandRelationshipsDB = async (userId) => {
  const { rows: deals } = await pool.query(
    `SELECT
       id,
       brand_name,
       platform,
       platform_custom,
       status,
       posting_date::text AS posting_date,
       payment_due_date::text AS payment_due_date,
       paid_date::text AS paid_date,
       created_at,
       revision_count,
       deliverable_count,
       ${MONEY_EXPR} AS revenue
     FROM deals
     WHERE user_id=$1
     ORDER BY created_at DESC`,
    [userId]
  );

  const { rows: inquiries } = await pool.query(
    `SELECT brand, contact, email, status, created_at, updated_at
     FROM inbound_inquiries
     WHERE user_id=$1
     ORDER BY created_at DESC`,
    [userId]
  );

  const map = new Map();

  const ensure = (brandName) => {
    const key = normalizeBrand(brandName) || "unknown";
    if (!map.has(key)) {
      map.set(key, {
        brand: brandName || "Unknown",
        total_deals: 0,
        total_revenue: 0,
        completed_campaigns: 0,
        active_deals: 0,
        revisions: 0,
        payment_days_total: 0,
        payment_records: 0,
        last_collaboration_at: null,
        last_contact_at: null,
        last_contact_source: null,
        deals: [],
        inquiries: []
      });
    }
    return map.get(key);
  };

  for (const deal of deals) {
    const brand = ensure(deal.brand_name);
    const revenue = Number(deal.revenue) || 0;
    brand.total_deals += 1;
    brand.total_revenue += revenue;
    brand.revisions += Number(deal.revision_count) || 0;
    if (deal.status === "completed") brand.completed_campaigns += 1;
    if (["pending", "active", "overdue"].includes(deal.status)) brand.active_deals += 1;

    const collabAt = deal.posting_date || deal.created_at;
    if (!brand.last_collaboration_at || new Date(collabAt) > new Date(brand.last_collaboration_at)) {
      brand.last_collaboration_at = collabAt;
    }
    if (!brand.last_contact_at || new Date(deal.created_at) > new Date(brand.last_contact_at)) {
      brand.last_contact_at = deal.created_at;
      brand.last_contact_source = "Deal";
    }

    const paymentDays = daysBetween(deal.posting_date || deal.created_at, deal.paid_date);
    if (paymentDays !== null) {
      brand.payment_days_total += paymentDays;
      brand.payment_records += 1;
    }

    brand.deals.push({
      id: deal.id,
      status: deal.status,
      platform: deal.platform_custom || deal.platform,
      revenue,
      posting_date: deal.posting_date,
      paid_date: deal.paid_date,
      revision_count: Number(deal.revision_count) || 0
    });
  }

  for (const inquiry of inquiries) {
    const brand = ensure(inquiry.brand);
    brand.inquiries.push(inquiry);
    const contactAt = inquiry.updated_at || inquiry.created_at;
    if (!brand.last_contact_at || new Date(contactAt) > new Date(brand.last_contact_at)) {
      brand.last_contact_at = contactAt;
      brand.last_contact_source = "Inbound";
    }
  }

  const now = new Date();
  const brands = [...map.values()]
    .map((brand) => {
      const averageDealValue = brand.total_deals > 0 ? brand.total_revenue / brand.total_deals : 0;
      const averagePaymentDays =
        brand.payment_records > 0 ? brand.payment_days_total / brand.payment_records : null;
      const repeatCollaborations = Math.max(0, brand.total_deals - 1);
      const daysSinceLast =
        brand.last_collaboration_at
          ? Math.round((now - new Date(brand.last_collaboration_at)) / 86400000)
          : null;

      return {
        ...brand,
        total_revenue: Math.round(brand.total_revenue * 100) / 100,
        average_deal_value: Math.round(averageDealValue * 100) / 100,
        average_payment_days:
          averagePaymentDays === null ? null : Math.round(averagePaymentDays * 10) / 10,
        repeat_collaborations: repeatCollaborations,
        days_since_last_collaboration: daysSinceLast,
        indicators: indicatorsFor({
          ...brand,
          repeat_collaborations: repeatCollaborations,
          days_since_last_collaboration: daysSinceLast
        })
      };
    })
    .sort((a, b) => b.total_revenue - a.total_revenue || b.total_deals - a.total_deals);

  return {
    brands,
    totals: {
      brands: brands.length,
      repeat_brands: brands.filter((brand) => brand.total_deals > 1).length,
      active_brand_relationships: brands.filter((brand) => brand.active_deals > 0).length,
      with_payment_history: brands.filter((brand) => brand.payment_records > 0).length
    }
  };
};
