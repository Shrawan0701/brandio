-- =============================================================================
-- BRANDIO · MIGRATION 010 — NORMALIZED DELIVERABLE MANAGEMENT
-- =============================================================================
-- Multiple deliverables per deal. Existing deal rows remain compatible.
-- =============================================================================

CREATE TABLE IF NOT EXISTS deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,

  title VARCHAR(180) NOT NULL,
  type VARCHAR(80) NULL,
  platform VARCHAR(80) NULL,
  description TEXT NULL,
  due_date DATE NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started','in_progress','submitted','changes_requested','approved','published','completed')),
  submission_date DATE NULL,
  approval_date DATE NULL,
  content_url TEXT NULL,
  notes TEXT NULL,
  revision_count INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deliverables_user ON deliverables(user_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_deal ON deliverables(deal_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_status ON deliverables(user_id, status);
CREATE INDEX IF NOT EXISTS idx_deliverables_due ON deliverables(user_id, due_date);
