const PRICING = {
  IN: {
    monthly: { amount: 9900, currency: "INR" },
    yearly: { amount: 49900, currency: "INR" }
  },

  DEFAULT: {
    monthly: { amount: 500, currency: "USD" },
    yearly: { amount: 4900, currency: "USD" }
  }
};

export const getPricing = (countryCode, planType) => {
  const countryPricing =
    PRICING[countryCode] || PRICING.DEFAULT;

  return countryPricing[planType];
};
