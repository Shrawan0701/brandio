export const FREE_DEAL_LIMIT = 1;
export const PLAN_MONTHS = Object.freeze({ monthly: 1, quarterly: 3, yearly: 12 });
export const isValidPlanType = (planType) => typeof planType === "string" && Object.hasOwn(PLAN_MONTHS, planType);

const PRICING = {
  IN: {
    monthly: { amount: 49900, currency: "INR" },
    quarterly: { amount: 119900, currency: "INR" },
    yearly: { amount: 499900, currency: "INR" }
  },

  DEFAULT: {
    monthly: { amount: 900, currency: "USD" },
    quarterly: { amount: 2500, currency: "USD" },
    yearly: { amount: 8900, currency: "USD" }
  }
};

export const getPricing = (countryCode, planType) => {
  if (!isValidPlanType(planType)) throw new Error("Invalid plan");
  const countryPricing =
    PRICING[countryCode] || PRICING.DEFAULT;

  return countryPricing[planType];
};
