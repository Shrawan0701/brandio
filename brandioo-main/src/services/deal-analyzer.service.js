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
  const match = text.match(/(?:₹|INR|Rs\.?|USD|\$)\s?[\d,]+(?:\.\d+)?/i);
  if (!match) return { value: "", currency: "" };
  const raw = match[0];
  const currency = /₹|INR|Rs/i.test(raw) ? "₹" : "$";
  return { value: raw.replace(/[^\d.]/g, ""), currency };
};

const findLines = (text, keywords) =>
  text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => keywords.some((keyword) => line.toLowerCase().includes(keyword)))
    .slice(0, 8);

export const analyzeWithRules = (text) => {
  const money = extractMoney(text);
  const lower = text.toLowerCase();
  const result = JSON.parse(JSON.stringify(emptyAnalysis));

  result.extracted_fields.deal_value = money.value;
  result.extracted_fields.currency = money.currency;
  result.extracted_fields.deliverables = findLines(text, ["deliverable", "reel", "story", "video", "post"]).join("\n");
  result.extracted_fields.payment_terms = findLines(text, ["payment", "invoice", "paid", "net "]).join("\n");
  result.extracted_fields.usage_rights = findLines(text, ["usage", "license", "rights"]).join("\n");
  result.extracted_fields.paid_advertising_rights = lower.includes("paid media") || lower.includes("paid ad") ? "Paid advertising usage mentioned" : "";
  result.extracted_fields.whitelisting = lower.includes("whitelist") || lower.includes("spark ad") ? "Whitelisting/spark ad language mentioned" : "";
  result.extracted_fields.exclusivity = findLines(text, ["exclusive", "exclusivity", "competitor"]).join("\n");
  result.extracted_fields.revision_requirements = findLines(text, ["revision", "edit round", "feedback"]).join("\n");
  result.extracted_fields.cancellation_terms = findLines(text, ["cancel", "termination"]).join("\n");
  result.extracted_fields.content_ownership = findLines(text, ["ownership", "own the content", "intellectual property"]).join("\n");
  result.extracted_fields.raw_footage_requirements = findLines(text, ["raw footage", "source file"]).join("\n");
  result.extracted_fields.approval_process = findLines(text, ["approval", "approve", "review"]).join("\n");
  result.extracted_fields.posting_dates = findLines(text, ["post by", "publish", "posting date", "go live"]).join("\n");
  result.extracted_fields.payment_due_date = findLines(text, ["due date", "net 15", "net 30", "within"]).join("\n");

  result.deal_summary = money.value
    ? `Detected a potential deal value of ${money.currency}${Number(money.value).toLocaleString("en-IN")}. Review the extracted fields before applying them to a deal.`
    : "Review the extracted fields below. Deal value was not clearly detected.";

  result.sections.deliverables = result.extracted_fields.deliverables ? result.extracted_fields.deliverables.split("\n") : [];
  result.sections.payment = result.extracted_fields.payment_terms ? result.extracted_fields.payment_terms.split("\n") : [];
  result.sections.usage = [result.extracted_fields.usage_rights, result.extracted_fields.paid_advertising_rights, result.extracted_fields.whitelisting].filter(Boolean);
  result.sections.exclusivity = result.extracted_fields.exclusivity ? result.extracted_fields.exclusivity.split("\n") : [];
  result.sections.important_dates = [result.extracted_fields.posting_dates, result.extracted_fields.payment_due_date].filter(Boolean);
  result.sections.potential_negotiation_points = [
    result.extracted_fields.usage_rights && "Review usage rights carefully.",
    result.extracted_fields.paid_advertising_rights && "Potential negotiation point: paid advertising usage.",
    result.extracted_fields.exclusivity && "Potential negotiation point: exclusivity scope and duration.",
    result.extracted_fields.revision_requirements && "Review revision requirements carefully."
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
              "Use cautious language such as 'Review this clause carefully', 'Potential negotiation point', and 'Information detected from the uploaded text'. " +
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
