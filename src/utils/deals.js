export const DEAL_TYPES = [
  { value: "paid", label: "Paid", hint: "Fixed cash campaign" },
  { value: "gifted", label: "Gifted", hint: "Product only" },
  { value: "barter", label: "Barter", hint: "Product for content" },
  { value: "affiliate", label: "Affiliate", hint: "Tracked commission" },
  { value: "commission", label: "Commission", hint: "Performance payout" },
  { value: "hybrid", label: "Hybrid", hint: "Fixed plus extras" }
];

export const PRODUCT_DEAL_TYPES = new Set(["gifted", "barter"]);
export const COMMISSION_DEAL_TYPES = new Set(["affiliate", "commission", "hybrid"]);

export const getDealType = (deal) => deal?.deal_type || "paid";

export const getDealTypeMeta = (type) =>
  DEAL_TYPES.find((item) => item.value === (type || "paid")) || DEAL_TYPES[0];

export const isProductDeal = (dealOrType) =>
  PRODUCT_DEAL_TYPES.has(typeof dealOrType === "string" ? dealOrType : getDealType(dealOrType));

export const isCommissionDeal = (dealOrType) =>
  COMMISSION_DEAL_TYPES.has(typeof dealOrType === "string" ? dealOrType : getDealType(dealOrType));

export const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const totalEarned = (deal) => {
  const type = getDealType(deal);
  const fixed = num(deal.fixed_amount ?? deal.amount);
  const commission = num(deal.commission_earned);

  if (type === "gifted" || type === "barter") return 0;
  if (type === "affiliate" || type === "commission") return commission;
  if (type === "hybrid") return fixed + commission;
  return num(deal.amount);
};

export const productValue = (deal) =>
  isProductDeal(deal) ? num(deal.product_value) : 0;

export const commissionRevenue = (deal) =>
  isCommissionDeal(deal) ? num(deal.commission_earned) : 0;

export const cashRevenue = (deal) => {
  const type = getDealType(deal);
  if (type === "paid") return num(deal.amount);
  if (type === "hybrid") return num(deal.fixed_amount ?? deal.amount);
  return 0;
};

export const formatMoney = (value, currency = "₹") => {
  const symbol = currency === "$" ? "$" : "₹";
  return `${symbol}${num(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
};
