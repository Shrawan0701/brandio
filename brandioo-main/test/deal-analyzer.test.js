import test from "node:test";
import assert from "node:assert/strict";
import { analyzeWithRules } from "../src/services/deal-analyzer.service.js";

const agreement = `INFLUENCER BRAND COLLABORATION AGREEMENT
Brand: NovaSkin India Pvt. Ltd.\\
Creator: Aditi Sharma (@aditibeauty)\\
Campaign: Glow Naturally – Skincare Launch
1. Deliverables
- 2 Instagram Reels, each 30–60 seconds long.
- 3 Instagram Stories per Reel.
- One link in bio for 7 days.
- Creator must submit content for approval at least 5 days before publication.
- All content must be published within 30 days of receiving the products.
2. Payment Terms
- Total compensation: ₹45,000.
- ₹15,000 payable after signing the agreement.
- Remaining ₹30,000 payable within 60 days after the final post is published.
- Brand may delay payment if internal finance approval is pending.
- No late payment penalty is specified.
3. Usage Rights
- Brand receives perpetual, worldwide, royalty-free rights to repost, edit, distribute, and use the content in paid advertisements.
- Brand may use the creator's name, image, and likeness across its website, social media, and digital advertisements.
- No additional compensation is payable for paid advertising usage.
4. Exclusivity
- Creator cannot promote competing skincare brands for 12 months after the first post.
- Competing brands include all skincare, cosmetics, beauty, and personal care companies.
5. Revisions and Cancellation
- Brand may request unlimited revisions until it approves the content.
- Brand can terminate the agreement at any time without paying for incomplete or unpublished work.
- If the creator cancels after signing, the creator must refund all advances and pay an additional ₹25,000 cancellation fee.
6. Performance Requirements
- Creator must achieve at least 100,000 combined Reel views within 14 days.
- If the target is missed, the creator must publish one additional Reel free of charge.
7. Disclosure and Compliance
- Creator must disclose the paid partnership according to applicable advertising guidelines.
- Creator must not make false or unverified product claims.
8. Governing Law
- This agreement is governed by the laws of India.`;

test("analyzer distinguishes contract value from days, installments, and cancellation fee", () => {
  const result = analyzeWithRules(agreement);
  assert.equal(result.extracted_fields.deal_value, "45000");
  assert.equal(result.extracted_fields.currency, "₹");
  assert.match(result.deal_summary, /₹45,000/);
  assert.match(result.extracted_fields.deliverables, /2 Instagram Reels/);
  assert.match(result.extracted_fields.deliverables, /3 Instagram Stories/);
  assert.match(result.extracted_fields.deliverables, /link in bio/);
  assert.match(result.extracted_fields.payment_terms, /₹15,000/);
  assert.match(result.extracted_fields.payment_terms, /₹30,000/);
  assert.match(result.extracted_fields.payment_due_date, /60 days/);
  assert.match(result.extracted_fields.usage_rights, /perpetual, worldwide, royalty-free/);
  assert.match(result.extracted_fields.exclusivity, /12 months/);
  assert.match(result.extracted_fields.revision_requirements, /unlimited revisions/);
  assert.match(result.extracted_fields.cancellation_terms, /₹25,000 cancellation fee/);
  assert.match(result.extracted_fields.performance_requirements, /100,000 combined Reel views/);
  assert.ok(result.sections.important_dates.some((item) => /5 days before publication/i.test(item)));
  assert.ok(result.sections.important_dates.some((item) => /30 days of receiving/i.test(item)));
  assert.ok(result.sections.potential_negotiation_points.length >= 6);
  assert.ok(result.sections.missing_or_unclear_information.some((item) => /finance approval/i.test(item)));
});

test("a duration is never extracted as money", () => {
  const result = analyzeWithRules("Publish within 30 days of receiving products. The brand can request unlimited revisions. Payment timing will be discussed later.");
  assert.equal(result.extracted_fields.deal_value, "");
  assert.equal(result.extracted_fields.currency, "");
});

test("explicit USD total wins over smaller payment installments", () => {
  const result = analyzeWithRules("Total deal value: USD 900. An advance of $300 is payable on signing. The remaining $600 is payable within 30 days.");
  assert.equal(result.extracted_fields.deal_value, "900");
  assert.equal(result.extracted_fields.currency, "$");
});

test("analyzer reads currency codes after amounts", () => {
  const result = analyzeWithRules("Campaign fee: 45,000 INR. Two Reels will be published within 30 days and payment follows the last post.");
  assert.equal(result.extracted_fields.deal_value, "45000");
  assert.equal(result.extracted_fields.currency, "₹");
});
