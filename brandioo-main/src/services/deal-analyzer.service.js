const emptyAnalysis = {
  deal_summary: "",
  extracted_fields: {
    deal_value: "",
    currency: "",
    deliverables: "",
    posting_dates: "",
    payment_terms: "",
    payment_due_date: "",
    performance_requirements: "",
    disclosure_requirements: "",
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
    performance: [],
    cancellation: [],
    disclosure: [],
    important_dates: [],
    potential_negotiation_points: [],
    missing_or_unclear_information: []
  },
  disclaimer:
    "Information detected from the uploaded text. This is not legal advice and does not determine whether a contract is legally valid."
};

const normalizedLines = (text) => String(text || "")
  .replace(/\\\s*\r?\n/g, "\n")
  .split(/\n+/)
  .map((line) => cleanLine(line))
  .filter(Boolean)
  .filter((line) => !isSectionHeading(line));

const moneyPattern = /(?<![\p{L}\p{N}])(₹|\$|₦|INR|Rs\.?|USD|NGN|Naira)\s*([\d,]+(?:\.\d{1,2})?)/giu;
const moneySuffixPattern = /([\d,]+(?:\.\d{1,2})?)\s*(INR|USD|NGN|rupees|dollars|naira)\b/giu;
const moneyCurrency = (token) => /^(₹|INR|Rs|rupees)/i.test(token) ? "₹" : /^(\$|USD|dollars)/i.test(token) ? "$" : "₦";

const extractMoney = (text) => {
  const lines = normalizedLines(text);
  const amounts = lines.flatMap((line, index) => [
    ...[...line.matchAll(moneyPattern)].map((match) => ({ value: match[2], token: match[1] })),
    ...[...line.matchAll(moneySuffixPattern)].map((match) => ({ value: match[1], token: match[2] }))
  ].map((match) => {
    const context = `${lines[index - 1] || ""} ${line}`.toLowerCase();
    return {
      value: Number(match.value.replaceAll(",", "")),
      currency: moneyCurrency(match.token),
      context,
      total: /\b(total compensation|total fee|total payment|total amount|deal value|contract value|agreed fee|campaign fee)\b/.test(context),
      penalty: /\b(cancellation fee|penalty|refund|damages|fine)\b/.test(line.toLowerCase()),
      advance: /\b(advance|deposit|after signing|upon signing|upfront)\b/.test(line.toLowerCase()),
      balance: /\b(remaining|balance|final installment)\b/.test(line.toLowerCase())
    };
  })).filter((item) => Number.isFinite(item.value) && item.value > 0);
  const explicit = amounts.filter((item) => item.total && !item.penalty).sort((a, b) => b.value - a.value)[0];
  if (explicit) return { value: String(explicit.value), currency: explicit.currency };
  const advance = amounts.find((item) => item.advance && !item.penalty);
  const balance = amounts.find((item) => item.balance && !item.penalty && item.currency === advance?.currency);
  if (advance && balance && advance !== balance) return { value: String(advance.value + balance.value), currency: advance.currency };
  const likely = amounts.filter((item) => !item.penalty).sort((a, b) => b.value - a.value)[0];
  return likely ? { value: String(likely.value), currency: likely.currency } : { value: "", currency: "" };
};

const cleanLine = (line) =>
  line
    .replace(/^\s*(?:\d+[\).:-]\s*|[-*•]\s*)/, "")
    .replace(/\s+/g, " ")
    .trim();

const summarizeLine = (line, max = 150) => {
  const cleaned = cleanLine(line);
  if (cleaned.length <= max) return cleaned;
  const sentence = cleaned.split(/(?<=[.!?])\s+/).find((part) => part.length >= 20 && part.length <= max);
  return sentence || `${cleaned.slice(0, max - 1).trim()}…`;
};

const isSectionHeading = (line) =>
  /^(?:parties|campaign scope|scope|deliverables|payment terms|compensation|payment|late payment|usage rights|usage|exclusivity|revisions and cancellation|cancellation|performance requirements|disclosure and compliance|governing law|approval|intellectual property)$/i.test(line.trim());

const findLines = (text, keywords) =>
  normalizedLines(text)
    .map((line) => summarizeLine(line, 220))
    .filter((line) => keywords.some((keyword) => line.toLowerCase().includes(keyword)))
    .filter((line) => !isSectionHeading(line))
    .filter(Boolean)
    .filter((line, index, arr) => arr.indexOf(line) === index)
    .slice(0, 10);

const toItems = (value) =>
  String(value || "")
    .split(/\n+/)
    .map((line) => summarizeLine(line))
    .filter(Boolean)
    .filter((line) => !isSectionHeading(line))
    .filter((line, index, arr) => arr.indexOf(line) === index)
    .slice(0, 10);
export const analyzeWithRules = (text) => {
  const money = extractMoney(text);
  const lower = text.toLowerCase();
  const result = JSON.parse(JSON.stringify(emptyAnalysis));
  const relevant = (keywords) => findLines(text, keywords);

  result.extracted_fields.deal_value = money.value;
  result.extracted_fields.currency = money.currency;
  result.extracted_fields.deliverables = relevant(["reel", "stor", "link in bio", "deliverable", "content must be published"]).join("\n");
  result.extracted_fields.payment_terms = relevant(["compensation", "payable", "payment", "finance approval", "late fee", "late payment", "invoice", "remaining"]).filter((line) => !/cancellation fee|refund/i.test(line)).join("\n");
  result.extracted_fields.usage_rights = relevant(["usage", "license", "rights", "royalty-free", "repost", "likeness", "paid advertis", "paid ad"]).join("\n");
  result.extracted_fields.paid_advertising_rights = lower.includes("paid media") || lower.includes("paid ad") || lower.includes("boost")
    ? "Paid advertising usage is mentioned. Confirm duration, channels, and extra fees."
    : "";
  result.extracted_fields.whitelisting = lower.includes("whitelist") || lower.includes("spark ad")
    ? "Whitelisting or spark ad access is mentioned. Confirm access length and permissions."
    : "";
  result.extracted_fields.exclusivity = relevant(["exclusive", "exclusivity", "competitor", "competing brand", "cannot promote competing"]).join("\n");
  result.extracted_fields.exclusivity_duration = relevant(["12 months", "months after", "years after"]).find((line) => /exclusiv|compet/i.test(line)) || "";
  result.extracted_fields.revision_requirements = relevant(["revision", "edit round", "feedback"]).join("\n");
  result.extracted_fields.cancellation_terms = relevant(["cancel", "terminat", "refund", "cancellation fee"]).join("\n");
  result.extracted_fields.content_ownership = findLines(text, ["ownership", "own the content", "intellectual property"]).join("\n");
  result.extracted_fields.raw_footage_requirements = findLines(text, ["raw footage", "source file"]).join("\n");
  result.extracted_fields.approval_process = relevant(["approval", "approve", "review"]).filter((line) => !/finance approval/i.test(line)).join("\n");
  result.extracted_fields.posting_dates = relevant(["post by", "publish", "publication", "posting date", "go live"]).join("\n");
  result.extracted_fields.payment_due_date = relevant(["payable within", "payment due", "net 15", "net 30", "net 60"]).join("\n");
  result.extracted_fields.performance_requirements = relevant(["view", "engagement", "target", "additional reel", "minimum views"]).join("\n");
  result.extracted_fields.disclosure_requirements = relevant(["disclos", "product claim", "applicable indian laws"]).join("\n");

  result.deal_summary = money.value
    ? `Detected ${money.currency}${Number(money.value).toLocaleString(money.currency === "$" ? "en-US" : "en-IN")} in deal compensation. Review the payment schedule and negotiation points before applying terms to a deal.`
    : "Deal value was not clearly found. Review the key terms below and confirm the amount before applying anything to a deal.";

  result.sections.deliverables = toItems(result.extracted_fields.deliverables);
  result.sections.payment = toItems(result.extracted_fields.payment_terms);
  result.sections.usage = [
    ...toItems(result.extracted_fields.usage_rights),
    result.extracted_fields.paid_advertising_rights,
    result.extracted_fields.whitelisting
  ].filter(Boolean);
  result.sections.exclusivity = toItems(result.extracted_fields.exclusivity);
  result.sections.performance = toItems(result.extracted_fields.performance_requirements);
  result.sections.cancellation = toItems(result.extracted_fields.cancellation_terms);
  result.sections.disclosure = toItems(result.extracted_fields.disclosure_requirements);
  result.sections.important_dates = [
    ...toItems(result.extracted_fields.posting_dates),
    ...toItems(result.extracted_fields.payment_due_date),
    ...relevant(["5 days before", "30 days of receiving", "14 days", "12 months after"])
  ];
  result.sections.potential_negotiation_points = [
    /internal finance approval|finance approval is pending/i.test(text) && "Clarify whether internal finance approval can extend the stated payment deadline.",
    /no late payment penalty|no late fee/i.test(text) && "Discuss what happens if payment arrives late; the text specifies no late-payment penalty.",
    /perpetual/i.test(text) && /paid advertis|paid ad/i.test(text) && "Discuss a defined term, scope, and separate fee for perpetual paid advertising rights.",
    !/perpetual/i.test(text) && result.extracted_fields.usage_rights && "Confirm exactly where and how long the brand can use the content.",
    result.extracted_fields.exclusivity && "Discuss the scope, length, and compensation for the exclusivity restriction.",
    /unlimited revisions/i.test(text) && "Agree a limit on revision rounds and a fee for additional changes.",
    !/unlimited revisions/i.test(text) && result.extracted_fields.revision_requirements && "Confirm how many revision rounds are included.",
    /terminat.{0,100}without paying|without paying.{0,100}(incomplete|unpublished)/i.test(text) && "Discuss payment for work completed if the brand terminates the agreement.",
    /cancellation fee/i.test(text) && "Review the creator cancellation fee and advance-refund terms before signing.",
    /100,?000.{0,100}views|additional reel free of charge/i.test(text) && "Clarify how views are measured and whether extra content is required when a target is missed."
  ].filter(Boolean);
  result.sections.missing_or_unclear_information = [
    !result.extracted_fields.deal_value && "Deal value is missing or unclear.",
    !result.extracted_fields.payment_due_date && "Payment due date is missing or unclear.",
    !result.extracted_fields.usage_rights && "Usage rights are missing or unclear.",
    !result.extracted_fields.revision_requirements && "Revision requirements are missing or unclear.",
    /internal finance approval|finance approval is pending/i.test(text) && "The outside payment date is unclear because finance approval can delay payment."
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
              "Identify the total deal compensation separately from deposits, balances, refunds, and cancellation penalties. " +
              "Never interpret a number of days or views as money. Preserve explicit currency symbols. " +
              "Highlight payment delays, perpetual paid-ad rights, broad exclusivity, unlimited revisions, one-sided cancellation, and performance penalties when present. " +
              "Each section item should be one clear bullet under 220 characters. " +
              "Use cautious language such as 'Confirm this before signing', 'Potential negotiation point', and 'Information detected from the uploaded text'. " +
              "Return JSON with deal_summary, extracted_fields, sections, disclaimer. extracted_fields must include: deal_value, currency, deliverables, posting_dates, payment_terms, payment_due_date, usage_rights, paid_advertising_rights, whitelisting, exclusivity, exclusivity_duration, revision_requirements, cancellation_terms, content_ownership, raw_footage_requirements, approval_process, performance_requirements, disclosure_requirements. sections must include arrays: deliverables, payment, usage, exclusivity, performance, cancellation, disclosure, important_dates, potential_negotiation_points, missing_or_unclear_information."
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
    const extractedFields = { ...emptyAnalysis.extracted_fields };
    for (const key of Object.keys(extractedFields)) {
      extractedFields[key] = fallback.extracted_fields[key] || String(parsed.extracted_fields?.[key] || "").trim();
    }
    extractedFields.deal_value = fallback.extracted_fields.deal_value;
    extractedFields.currency = fallback.extracted_fields.currency;
    const sections = { ...emptyAnalysis.sections };
    for (const key of Object.keys(sections)) {
      const aiItems = Array.isArray(parsed.sections?.[key]) ? parsed.sections[key] : [];
      sections[key] = [...new Set([
        ...fallback.sections[key],
        ...aiItems.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean)
      ])].slice(0, 14);
    }
    return {
      deal_summary: fallback.deal_summary,
      extracted_fields: extractedFields,
      sections,
      disclaimer: fallback.disclaimer,
      source: "ai"
    };
  } catch {
    return fallback;
  }
};


