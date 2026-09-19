-- =============================================================================
-- BRANDIO · MIGRATION 006 — CREATOR INBOUND COLLABORATION INQUIRIES
-- =============================================================================
-- Public Work With Me submissions become opportunities first, not confirmed deals.
-- =============================================================================

CREATE TABLE IF NOT EXISTS inbound_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  converted_deal_id UUID NULL REFERENCES deals(id) ON DELETE SET NULL,

  brand VARCHAR(150) NOT NULL,
  contact VARCHAR(150) NOT NULL,
  email VARCHAR(180) NOT NULL,
  website TEXT NULL,

  campaign VARCHAR(180) NULL,
  campaign_type VARCHAR(80) NULL,
  budget VARCHAR(80) NULL,
  platform VARCHAR(80) NULL,
  deliverables TEXT NULL,
  deadline DATE NULL,
  usage_requirements TEXT NULL,
  description TEXT NULL,
  notes TEXT NULL,

  status VARCHAR(30) NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'reviewing', 'negotiating', 'accepted', 'rejected', 'archived')),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inbound_user ON inbound_inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inbound_status ON inbound_inquiries(user_id, status);
CREATE INDEX IF NOT EXISTS idx_inbound_created ON inbound_inquiries(user_id, created_at);
