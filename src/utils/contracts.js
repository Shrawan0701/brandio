/* =========================================================
   CONTRACTS · helpers
   Status/signature labels, date + file formatting.
   "Signed" is creator-marked tracking only — no legal
   e-signature claim anywhere in this UI.
   ========================================================= */

export const CONTRACT_STATUSES = {
  awaiting_signature: { label: "Awaiting signature", tone: "amber" },
  signed: { label: "Signed", tone: "green" },
  expired: { label: "Expired", tone: "red" }
};

export const EXPIRY_STATES = {
  awaiting_signature: { label: "Awaiting signature", tone: "amber" },
  signed: { label: "Signed", tone: "green" },
  expiring_soon: { label: "Expiring soon", tone: "amber" },
  expired: { label: "Expired", tone: "red" }
};

export const SIGNATURE_STATUSES = {
  unsigned: "Unsigned",
  awaiting: "Awaiting signature",
  signed: "Signed"
};

export const statusInfo = (contract) =>
  EXPIRY_STATES[contract?.expiry_state] ||
  CONTRACT_STATUSES[contract?.status] || {
    label: "Awaiting signature",
    tone: "amber"
  };

export const formatShortDate = (value) => {
  if (!value) return "—";
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });
};

export const formatFullDate = (value) => {
  if (!value) return "—";
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
};

export const daysUntil = (value) => {
  if (!value) return null;
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
};

export const isPdf = (contract) =>
  /\.pdf($|\?)/i.test(contract?.file_url || "") ||
  /\.pdf($|\?)/i.test(contract?.file_name || "");

export const fileKindLabel = (contract) => {
  if (isPdf(contract)) return "PDF document";
  if (contract?.file_url) return "Attached document";
  return "No file attached";
};

export const computeContractStats = (contracts = []) => ({
  total: contracts.length,
  awaiting_signature: contracts.filter(
    (c) => c.expiry_state === "awaiting_signature"
  ).length,
  signed: contracts.filter((c) => c.expiry_state === "signed").length,
  expiring_soon: contracts.filter((c) => c.expiry_state === "expiring_soon")
    .length,
  expired: contracts.filter((c) => c.expiry_state === "expired").length
});
