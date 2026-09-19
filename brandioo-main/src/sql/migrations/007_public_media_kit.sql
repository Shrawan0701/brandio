-- =============================================================================
-- BRANDIO · MIGRATION 007 — PUBLIC CREATOR MEDIA KIT SETTINGS
-- =============================================================================
-- Stores only creator-approved public presentation settings.
-- Public portfolio content continues to come from portfolio_items.is_public.
-- =============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS media_kit_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS media_kit JSONB NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_users_media_kit_public
  ON users(lower(username))
  WHERE media_kit_enabled = TRUE;
