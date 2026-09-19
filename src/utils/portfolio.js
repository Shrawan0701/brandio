/* =========================================================
   PORTFOLIO · presentation helpers
   Shared by the portfolio page, cards and the dashboard CTA.
   ========================================================= */

const CURRENCY_SYMBOLS = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AUD: "A$",
  CAD: "C$",
  SGD: "S$",
  AED: "AED",
  JPY: "¥",
  BRL: "R$"
};

/* Metrics that can be attached to a portfolio item */
export const METRIC_FIELDS = [
  { key: "views", label: "Views", placeholder: "120000" },
  { key: "likes", label: "Likes", placeholder: "8400" },
  { key: "comments", label: "Comments", placeholder: "320" },
  { key: "shares", label: "Shares", placeholder: "140" },
  { key: "saves", label: "Saves", placeholder: "900" },
  { key: "engagement_rate", label: "Engagement %", placeholder: "4.8" }
];

export function currencySymbol(currency) {
  const raw = String(currency || "").trim();
  return CURRENCY_SYMBOLS[raw.toUpperCase()] || raw;
}

/* Amounts can be stored as symbol (₹) or ISO code (INR) — both are handled */
export function formatAmount(amount, currency) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "";

  const symbol = currencySymbol(currency);
  const formatted = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2
  }).format(value);

  if (!symbol) return formatted;

  return symbol.length > 1 ? `${symbol} ${formatted}` : `${symbol}${formatted}`;
}

export function formatPlatform(deal) {
  if (!deal) return "";

  const platform = deal.platform || "";
  const custom = deal.platform_custom || "";

  if (platform.toLowerCase() === "other") return custom || "Other";
  return platform || "Other";
}

export function formatCompactNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return "0";

  if (num >= 1000000) {
    const millions = num / 1000000;
    return `${Number.isInteger(millions) ? millions : millions.toFixed(1)}M`;
  }

  if (num >= 1000) {
    const thousands = num / 1000;
    return `${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)}K`;
  }

  return String(num);
}

/* Timezone-safe date rendering — dates arrive as 'YYYY-MM-DD' strings */
export function formatLongDate(value) {
  if (!value) return "";

  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return "";

  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export function formatMonthYear(value) {
  if (!value) return "";

  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  if (!year || !month) return "";

  return new Date(year, month - 1, day || 1).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric"
  });
}

/* "1 Reel, 2 Stories" -> ["1 Reel", "2 Stories"] */
export function parseDeliverables(input) {
  return String(input || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export function deliverablesToInput(list) {
  return Array.isArray(list) ? list.join(", ") : "";
}

export function metricsFromItem(metrics) {
  const source = metrics && typeof metrics === "object" ? metrics : {};
  const values = {};

  for (const field of METRIC_FIELDS) {
    const raw = source[field.key];
    values[field.key] = raw === undefined || raw === null ? "" : String(raw);
  }

  return values;
}

/* Local stats so the header updates instantly after a toggle */
export function computeStats(items = []) {
  const stats = { total: items.length, featured: 0, public: 0, reach: 0, platforms: 0 };
  const platforms = new Set();

  for (const item of items) {
    if (item.is_featured) stats.featured += 1;
    if (item.is_public) stats.public += 1;

    const views = Number(item.metrics?.views);
    if (Number.isFinite(views)) stats.reach += views;

    const platform = formatPlatform(item).trim().toLowerCase();
    if (platform) platforms.add(platform);
  }

  stats.platforms = platforms.size;
  return stats;
}

export function visibleMetrics(metrics) {
  const source = metrics && typeof metrics === "object" ? metrics : {};

  return METRIC_FIELDS.filter((field) => {
    const value = Number(source[field.key]);
    return Number.isFinite(value) && value > 0;
  }).map((field) => ({ ...field, value: Number(source[field.key]) }));
}