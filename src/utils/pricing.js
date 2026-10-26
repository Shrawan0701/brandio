export const FREE_DEAL_LIMIT = 1;

export const PRO_FEATURES = [
  "Unlimited brand deals",
  "Payment reminders and overdue alerts",
  "Deliverables, contracts and proof uploads",
  "Money dashboard, analytics and ROI",
  "Public profile, portfolio and media kit",
  "Inbound inquiries, rate insights and deal analyzer"
];

export function isProActive(user) {
  return user?.plan === "pro" && (!user.plan_expiry || new Date(user.plan_expiry).getTime() > Date.now());
}

export function freeDealCreditsUsed(user, currentDeals = 0) {
  return Math.max(Number(user?.deal_creations_used) || 0, currentDeals);
}

export function isFreeDealLimitUsed(user, currentDeals = 0) {
  return Boolean(user) && !isProActive(user) && freeDealCreditsUsed(user, currentDeals) >= FREE_DEAL_LIMIT;
}

export function getDisplayPricing(countryCode) {
  return countryCode === "IN"
    ? { monthly: "₹499", quarterly: "₹1,199", yearly: "₹4,999", currency: "INR" }
    : { monthly: "$9", quarterly: "$25", yearly: "$89", currency: "USD" };
}

export function assertCheckoutPrice(countryCode, planType, checkout) {
  const pricing = getDisplayPricing(countryCode);
  const displayPrice = pricing[planType];
  if (!displayPrice) throw new Error("Unknown billing plan.");
  const expectedAmount = Number(displayPrice.replace(/[^0-9]/g, "")) * 100;
  if (Number(checkout?.amount) !== expectedAmount || checkout?.currency !== pricing.currency) {
    throw new Error("Checkout pricing is out of date. Please restart or update the Brandio API and try again.");
  }
}

export function getPaidPlans(countryCode) {
  const pricing = getDisplayPricing(countryCode);
  return [
    {
      id: "monthly",
      name: "Pro Monthly",
      price: pricing.monthly,
      cadence: "per month",
      description: "Full access with a one-month commitment.",
      detail: "One payment for 1 month"
    },
    {
      id: "quarterly",
      name: "Pro Quarterly",
      price: pricing.quarterly,
      cadence: "every 3 months",
      description: "Keep your creator business moving for three months.",
      detail: "One payment for 3 months",
      featured: true,
      badge: "3-month plan"
    },
    {
      id: "yearly",
      name: "Pro Yearly",
      price: pricing.yearly,
      cadence: "per year",
      description: "A full year of Brandio in one payment.",
      detail: "One payment for 12 months"
    }
  ];
}
