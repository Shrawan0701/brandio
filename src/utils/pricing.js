export function getDisplayPricing(countryCode) {
  if (countryCode === "IN") {
    return {
      monthly: "₹99",
      yearly: "₹499",
      currency: "INR"
    };
  }

  return {
    monthly: "$5",
    yearly: "$49",
    currency: "USD"
  };
}
