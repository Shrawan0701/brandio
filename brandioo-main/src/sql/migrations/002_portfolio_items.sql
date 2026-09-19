-- =============================================================================
-- BRANDIO · MIGRATION 002 — CREATOR PORTFOLIO / PROOF OF WORK
-- =============================================================================
-- WHY
--   Completed deals should become useful proof of work. Instead of duplicating
--   deal data, `portfolio_items` stores ONLY the portfolio-specific layer and
--   joins `deals` for brand_name, platform, amount, currency and status:
--
--     brand / platform / campaign amount / deal status  -> read from deals
--     campaign title / deliverables / completion date / content URL /
--     thumbnail / metrics / notes / visibility / featured -> stored here
--
--   CONSTRAINT: one portfolio item per deal per user (portfolio_items_user_deal_key).
--   Deleting a deal cascades to its portfolio item, so the portfolio can never
--   point at work that no longer exists.
--
-- SAFETY
--   * Additive + idempotent only. No DROP / ALTER of existing tables / data moves.
--   * Safe to run on the live database and on a fresh one.
--
-- HOW TO RUN (from the brandioo-main folder)
--   psql "$DATABASE_URL" -f src/sql/migrations/002_portfolio_items.sql
--   (or paste into the pgAdmin / Neon / Supabase SQL editor)
-- =============================================================================

CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,

  -- portfolio-specific layer (everything else comes from deals)
  campaign_title VARCHAR(150) NULL,
  deliverables TEXT[] NOT NULL DEFAULT '{}',
  completion_date DATE NULL,
  content_url TEXT NULL,
  thumbnail_url TEXT NULL,
  metrics JSONB NOT NULL DEFAULT '{}',      -- { views, likes, comments, shares, saves, engagement_rate }
  creator_notes TEXT NULL,

  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT portfolio_items_user_deal_key UNIQUE (user_id, deal_id)
);

ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS deal_id UUID REFERENCES deals(id) ON DELETE CASCADE;
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS campaign_title VARCHAR(150) NULL;
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS deliverables TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS completion_date DATE NULL;
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS content_url TEXT NULL;
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS thumbnail_url TEXT NULL;
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS metrics JSONB NOT NULL DEFAULT '{}';
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS creator_notes TEXT NULL;
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'portfolio_items_user_deal_key'
  ) THEN
    ALTER TABLE portfolio_items
      ADD CONSTRAINT portfolio_items_user_deal_key UNIQUE (user_id, deal_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_portfolio_user     ON portfolio_items(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_deal     ON portfolio_items(deal_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_featured ON portfolio_items(user_id, is_featured);
CREATE INDEX IF NOT EXISTS idx_portfolio_public   ON portfolio_items(user_id, is_public);
