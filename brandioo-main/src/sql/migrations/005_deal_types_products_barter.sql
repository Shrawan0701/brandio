-- =============================================================================
-- BRANDIO · MIGRATION 005 — PRODUCT, GIFTING AND BARTER DEAL TRACKING
-- =============================================================================
-- Additive only. Existing rows remain compatible as paid deals.
-- =============================================================================

ALTER TABLE deals ADD COLUMN IF NOT EXISTS deal_type VARCHAR(20) NOT NULL DEFAULT 'paid';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS product_name VARCHAR(150) NULL;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS product_value NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS received_date DATE NULL;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS deliverables TEXT NULL;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS expected_content_date DATE NULL;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS shipping_tracking TEXT NULL;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS notes TEXT NULL;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS fixed_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS commission_percentage NUMERIC(6,2) NOT NULL DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS commission_earned NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS total_earned NUMERIC(12,2) NOT NULL DEFAULT 0;

UPDATE deals
SET
  deal_type = COALESCE(NULLIF(deal_type, ''), 'paid'),
  fixed_amount = COALESCE(NULLIF(fixed_amount, 0), amount, 0),
  total_earned = COALESCE(NULLIF(total_earned, 0), amount, 0)
WHERE deal_type = 'paid';

CREATE INDEX IF NOT EXISTS idx_deals_deal_type ON deals(user_id, deal_type);
