const fallbackExplanation = (result) => {
  const attrs = result.attributes || {};
  const reasons = [];
  if (attrs.paid_ad_usage) reasons.push("paid advertising usage");
  if (attrs.exclusivity) reasons.push("exclusivity");
  if (attrs.usage_rights && attrs.usage_rights !== "Organic only") reasons.push("usage rights");
  if (attrs.turnaround === "Rush") reasons.push("rush turnaround");

  return {
    explanation: reasons.length
      ? `The suggested range moves from your historical comparable deals because this quote includes ${reasons.join(", ")}. The range is still based only on your recorded Brandio deals.`
      : "The suggested range stays close to your comparable recorded deals because no major usage, exclusivity, or rush factors were selected.",
    negotiation_considerations:
      "Use this as a planning estimate, not an objective market price. Clarify usage period, paid ad rights, revision limits, timeline, deliverables and payment schedule before confirming.",
    negotiation_message:
      `Thanks for sharing the campaign details. Based on the deliverables, usage, timeline and my recent recorded collaborations, my quote range for this scope is ${result.currency === "USD" ? "$" : "₹"}${result.suggested_range?.low || 0} to ${result.currency === "USD" ? "$" : "₹"}${result.suggested_range?.high || 0}. Happy to refine once usage rights, revision rounds and timeline are final.`
  };
};

export const explainRate = async (result) => {
  const fallback = fallbackExplanation(result);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { ...fallback, source: "rules" };

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.25,
        max_tokens: 420,
        messages: [
          {
            role: "system",
            content:
              "You explain creator quote planning using ONLY the supplied Brandio historical deal data. " +
              "Do not invent external market statistics. Do not call the result a market price. " +
              "Return compact JSON with explanation, negotiation_considerations, negotiation_message."
          },
          { role: "user", content: JSON.stringify(result) }
        ]
      })
    });
    if (!res.ok) return { ...fallback, source: "rules" };
    const json = await res.json();
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) return { ...fallback, source: "rules" };
    const parsed = JSON.parse(text.replace(/^```json|```$/g, "").trim());
    return {
      explanation: parsed.explanation || fallback.explanation,
      negotiation_considerations: parsed.negotiation_considerations || fallback.negotiation_considerations,
      negotiation_message: parsed.negotiation_message || fallback.negotiation_message,
      source: "ai"
    };
  } catch {
    return { ...fallback, source: "rules" };
  }
};
