export const normalizeCurrency = (value) => {
  const code = String(value || "").trim().toUpperCase();
  return code === "$" || code === "USD" ? "USD" : "INR";
};

export const currencySql = (column = "currency") =>
  `CASE WHEN UPPER(TRIM(${column})) IN ('$', 'USD') THEN 'USD' ELSE 'INR' END`;

export const pickCurrency = (available, requested) => {
  const currencies = [...new Set(available.map(normalizeCurrency))];
  return requested && currencies.includes(normalizeCurrency(requested))
    ? normalizeCurrency(requested)
    : currencies[0] || normalizeCurrency(requested);
};
