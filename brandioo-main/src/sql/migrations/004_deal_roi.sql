-- =============================================================================
-- BRANDIO · MIGRATION 004 — CREATOR DEAL ROI (EFFORT + EXPENSES)
-- =============================================================================
-- WHY
--   Creators need to know whether a collaboration was worth their time.
--   These columns extend `deals` directly (1:1 with the campaign) so no
--   new table or JOIN is needed. All are nullable/zero-default so existing
--   rows need no backfill.
--
--   hours_spent      NUMERIC  — total creator hours invested
--   revision_count   INT      — rounds of revision requested
--   deliverable_count INT     — number of deliverables shipped
--   expenses         NUMERIC  — creator-side campaign expenses
--   paid_date        DATE     — date payment actually landed (for wait time)
--   roi_notes        TEXT     — optional freeform notes
--
-- SAFETY: additive + idempotent only.
-- RUN: psql "$DATABASE_URL" -f src/sql/migrations/004_deal_roi.sql
-- =============================================================================

ALTER TABLE deals ADD COLUMN IF NOT EXISTS hours_spent NUMERIC(8,2) NULL;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS revision_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS deliverable_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS expenses NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS paid_date DATE NULL;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS roi_notes TEXT NULL;
