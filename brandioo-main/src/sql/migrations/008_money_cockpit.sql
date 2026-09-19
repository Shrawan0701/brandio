-- =============================================================================
-- BRANDIO · MIGRATION 008 — MONEY COCKPIT SETTINGS
-- =============================================================================
-- Planning settings only. No tax advice or tax liability calculation.
-- =============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS money_settings JSONB NOT NULL DEFAULT '{}';
