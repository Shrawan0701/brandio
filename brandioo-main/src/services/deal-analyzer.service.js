const emptyAnalysis = {
  deal_summary: "",
  extracted_fields: {
    deal_value: "",
    currency: "",
    deliverables: "",
    posting_dates: "",
    payment_terms: "",
    payment_due_date: "",
    usage_rights: "",
    paid_advertising_rights: "",
    whitelisting: "",
    exclusivity: "",
    exclusivity_duration: "",
    revision_requirements: "",
    cancellation_terms: "",
    content_ownership: "",
    raw_footage_requirements: "",
    approval_process: ""
  },
  sections: {
    deliverables: [],
    payment: [],
    usage: [],
    exclusivity: [],
    important_dates: [],
    potential_negotiation_points: [],
    missing_or_unclear_information: []
  },
  disclaimer:
    "Information detected from the uploaded text. This is not legal advice and does not determine whether a contract is legally valid."
};

const extractMoney = (text) => {
  const match = text.match(/(?:\u20B9|INR|Rs\.?|USD|\$|\u20A6|NGN|Naira|N)\s?[\d,]+(?:\.\d+)?/i);
  if (!match) return { value: "", currency: "" };
  const raw = match[0];
  const currency = /\u20B9|INR|Rs/i.test(raw) ? "\u20B9" : /\$|USD/i.test(raw) ? "$" : "\u20A6";
  return { value: raw.replace(/[^\d.]/g, ""), currency };
};

const cleanLine = (line) =>
  line
    .replace(/^\s*(?:\d+[\).:-]?|[-*•])\s*/, "")
    .replace(/\s+/g, " ")
    .trim();

const summarizeLine = (line, max = 150) => {
  const cleaned = cleanLine(line);
  if (cleaned.length <= max) return cleaned;
  const sentence = cleaned.split(/(?<=[.!?])\s+/).find((part) => part.length >= 20 && part.length <= max);
  return sentence || `${cleaned.slice(0, max - 1).trim()}…`;
};

const isSectionHeading = (line) =>
  /^(parties|campaign scope|scope|compensation|payment|late payment|usage rights|usage|exclusivity|cancellation|approval|intellectual property)$/i.test(line.trim());

const findLines = (text, keywords) =>
  text
    .split(/\n+/)
    .map((line) => summarizeLine(line))
    .filter((line) => keywords.some((keyword) => line.toLowerCase().includes(keyword)))
    .filter((line) => !isSectionHeading(line))
    .filter(Boolean)
    .filter((line, index, arr) => arr.indexOf(line) === index)
    .slice(0, 4);

const toItems = (value) =>
  String(value || "")
    .split(/\n+/)
    .map((line) => summarizeLine(line))
    .filter(Boolean)
    .filter((line) => !isSectionHeading(line))
    .filter((line, index, arr) => arr.indexOf(line) === index)
    .slice(0, 5);
export const analyzeWithRules = (text) => {
  const money = extractMoney(text);
  const lower = text.toLowerCase();
  const result = JSON.parse(JSON.stringify(emptyAnalysis));

  result.extracted_fields.deal_value = money.value;
  result.extracted_fields.currency = money.currency;
  result.extracted_fields.deliverables = findLines(text, ["deliverable", "reel", "story", "video", "post"]).join("\n");
  result.extracted_fields.payment_terms = findLines(text, ["payment", "invoice", "campaign fee", "paid within", "net ", "late fee"]).join("\n");
  result.extracted_fields.usage_rights = findLines(text, ["usage", "license", "rights"]).join("\n");
  result.extracted_fields.paid_advertising_rights = lower.includes("paid media") || lower.includes("paid ad") || lower.includes("boost")
    ? "Paid advertising usage is mentioned. Confirm duration, channels, and extra fees."
    : "";
  result.extracted_fields.whitelisting = lower.includes("whitelist") || lower.includes("spark ad")
    ? "Whitelisting or spark ad access is mentioned. Confirm access length and permissions."
    : "";
  result.extracted_fields.exclusivity = findLines(text, ["exclusive", "exclusivity", "competitor"]).join("\n");
  result.extracted_fields.revision_requirements = findLines(text, ["revision", "edit round", "feedback"]).join("\n");
  result.extracted_fields.cancellation_terms = findLines(text, ["cancel", "termination"]).join("\n");
  result.extracted_fields.content_ownership = findLines(text, ["ownership", "own the content", "intellectual property"]).join("\n");
  result.extracted_fields.raw_footage_requirements = findLines(text, ["raw footage", "source file"]).join("\n");
  result.extracted_fields.approval_process = findLines(text, ["approval", "approve", "review"]).join("\n");
  result.extracted_fields.posting_dates = findLines(text, ["post by", "publish", "posting date", "go live"]).join("\n");
  result.extracted_fields.payment_due_date = findLines(text, ["due date", "net 15", "net 30", "within"]).join("\n");

  result.deal_summary = money.value
    ? `Found a likely deal value of ${money.currency}${Number(money.value).toLocaleString("en-IN")}. Review the key terms below before applying anything to a deal.`
    : "Deal value was not clearly found. Review the key terms below and confirm the amount before applying anything to a deal.";

  result.sections.deliverables = toItems(result.extracted_fields.deliverables);
  result.sections.payment = toItems(result.extracted_fields.payment_terms);
  result.sections.usage = [
    ...toItems(result.extracted_fields.usage_rights),
    result.extracted_fields.paid_advertising_rights,
    result.extracted_fields.whitelisting
  ].filter(Boolean);
  result.sections.exclusivity = toItems(result.extracted_fields.exclusivity);
  result.sections.important_dates = [
    ...toItems(result.extracted_fields.posting_dates),
    ...toItems(result.extracted_fields.payment_due_date)
  ];
  result.sections.potential_negotiation_points = [
    result.extracted_fields.usage_rights && "Confirm exactly where and how long the brand can use the content.",
    result.extracted_fields.paid_advertising_rights && "If paid ads or boosting are included, confirm the usage period and added fee.",
    result.extracted_fields.exclusivity && "Confirm exclusivity scope, duration, and which competitors are covered.",
    result.extracted_fields.revision_requirements && "Confirm how many revision rounds are included and what counts as extra work."
  ].filter(Boolean);
  result.sections.missing_or_unclear_information = [
    !result.extracted_fields.deal_value && "Deal value is missing or unclear.",
    !result.extracted_fields.payment_due_date && "Payment due date is missing or unclear.",
    !result.extracted_fields.usage_rights && "Usage rights are missing or unclear.",
    !result.extracted_fields.revision_requirements && "Revision requirements are missing or unclear."
  ].filter(Boolean);

  return { ...result, source: "rules" };
};

export const analyzeDealTerms = async (text) => {
  const fallback = analyzeWithRules(text);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallback;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.15,
        max_tokens: 1500,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You extract business information from creator brand deal terms. " +
              "Do not provide legal advice. Do not say a contract is legally valid or invalid. " +
              "Write concise, plain-English business summaries. Do not dump full clauses unless a short quote is necessary. " +
              "Each section item should be one clear bullet under 160 characters. " +
              "Use cautious language such as 'Confirm this before signing', 'Potential negotiation point', and 'Information detected from the uploaded text'. " +
              "Return JSON with deal_summary, extracted_fields, sections, disclaimer. extracted_fields must include: deal_value, currency, deliverables, posting_dates, payment_terms, payment_due_date, usage_rights, paid_advertising_rights, whitelisting, exclusivity, exclusivity_duration, revision_requirements, cancellation_terms, content_ownership, raw_footage_requirements, approval_process. sections must include arrays: deliverables, payment, usage, exclusivity, important_dates, potential_negotiation_points, missing_or_unclear_information."
          },
          { role: "user", content: text.slice(0, 20000) }
        ]
      })
    });
    if (!res.ok) return fallback;
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) return fallback;
    const parsed = JSON.parse(content);
    return {
      ...emptyAnalysis,
      ...parsed,
      extracted_fields: { ...emptyAnalysis.extracted_fields, ...(parsed.extracted_fields || {}) },
      sections: { ...emptyAnalysis.sections, ...(parsed.sections || {}) },
      source: "ai"
    };
  } catch {
    return fallback;
  }
};


