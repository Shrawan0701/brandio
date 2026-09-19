import { getIntelligence } from "./intelligence.service.js";

/* =========================================================
   AI BRIEF · optional OpenAI narrative over the creator's OWN
   intelligence payload. No benchmarks, no invented data: the
   model only receives aggregated stats already computed from
   the creator's deals. When OPENAI_API_KEY is absent (default),
   the endpoint returns a deterministic rules-based brief so the
   UI never breaks.
   ========================================================= */

const briefFromRules = (d) => {
  const t = d.totals || {};
  const lines = [];
  if (t.totalDeals) {
    lines.push(
      `You have ${t.totalDeals} deals on record (${t.completedCount || 0} completed) ` +
      `worth ${Math.round(t.totalEarned || 0).toLocaleString("en-IN")} in completed value.`
    );
  }
  const topP = (d.platformRevenue || [])[0];
  if (topP) lines.push(`Your strongest platform is ${topP.platform}.`);
  const topB = (d.brandRevenue || [])[0];
  if (topB) lines.push(`Your highest-value brand relationship is ${topB.brand}.`);
  if ((t.pendingAmount || 0) > 0) {
    lines.push(`Follow up on ${Math.round(t.pendingAmount).toLocaleString("en-IN")} pending across open deals.`);
  }
  return lines.length
    ? lines.join(" ")
    : "Add and complete deals and this brief will describe your business in plain words.";
};

export const getAiBrief = async (userId) => {
  const data = await getIntelligence(userId);
  const fallback = briefFromRules(data);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { brief: fallback, source: "rules" };

  try {
    const summary = {
      totals: data.totals,
      platformRevenue: (data.platformRevenue || []).slice(0, 5),
      brandRevenue: (data.brandRevenue || []).slice(0, 5),
      revenueTrend: data.revenueTrend,
      performance: data.performance
    };
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.3,
        max_tokens: 220,
        messages: [
          {
            role: "system",
            content:
              "You are Brandio Intelligence. Write a short creator business brief in plain words. " +
              "Use ONLY the numbers provided. Never invent benchmarks, advice beyond the data, or deals. " +
              "Max 5 sentences."
          },
          { role: "user", content: JSON.stringify(summary) }
        ]
      })
    });
    if (!res.ok) return { brief: fallback, source: "rules" };
    const json = await res.json();
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) return { brief: fallback, source: "rules" };
    return { brief: text, source: "ai" };
  } catch {
    return { brief: fallback, source: "rules" };
  }
};
