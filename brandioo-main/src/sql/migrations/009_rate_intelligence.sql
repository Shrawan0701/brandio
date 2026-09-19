-- =============================================================================
-- BRANDIO · MIGRATION 009 — RATE INTELLIGENCE SAVED QUOTES
-- =============================================================================
-- Stores creator-generated quote planning outputs. Not market pricing.
-- =============================================================================

CREATE TABLE IF NOT EXISTS rate_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quote_inputs JSONB NOT NULL DEFAULT '{}',
  quote_result JSONB NOT NULL DEFAULT '{}',
  negotiation_message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rate_quotes_user ON rate_quotes(user_id, created_at);
