-- ===============================
-- BRANDIO · BASELINE SCHEMA
-- ===============================
-- NOTE: this file is the original baseline and is intentionally additive.
-- The live database has drifted from it (extra columns already used by the
-- backend). Apply src/sql/migrations/001_reconcile_live_schema.sql first /
-- alongside this file so a fresh database always matches production.
-- ===============================
-- EXTENSIONS
-- ===============================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===============================
-- USERS
-- ===============================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,

  country_code CHAR(2) NOT NULL,

  plan VARCHAR(10) DEFAULT 'free',
  plan_expiry TIMESTAMP NULL,
  deal_creations_used INTEGER NOT NULL DEFAULT 0,

  profile_image_url TEXT NULL,

  social_links JSONB DEFAULT '{}',
  media_kit_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  media_kit JSONB NOT NULL DEFAULT '{}',
  money_settings JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- DEALS
-- ===============================
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  brand_name VARCHAR(100) NOT NULL,

  platform VARCHAR(30) NOT NULL,
  platform_custom VARCHAR(50) NULL,

  amount NUMERIC(10,2) NOT NULL,
  currency CHAR(3) NOT NULL,

  deal_type VARCHAR(20) NOT NULL DEFAULT 'paid',
  product_name VARCHAR(150) NULL,
  product_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  received_date DATE NULL,
  deliverables TEXT NULL,
  expected_content_date DATE NULL,
  shipping_tracking TEXT NULL,
  notes TEXT NULL,
  fixed_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  commission_percentage NUMERIC(6,2) NOT NULL DEFAULT 0,
  commission_earned NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_earned NUMERIC(12,2) NOT NULL DEFAULT 0,

  status VARCHAR(20) DEFAULT 'pending',

  posting_date DATE NULL,
  payment_due_date DATE NULL,

  hours_spent NUMERIC(8,2) NULL,
  revision_count INTEGER NOT NULL DEFAULT 0,
  deliverable_count INTEGER NOT NULL DEFAULT 0,
  expenses NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_date DATE NULL,
  roi_notes TEXT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- PAYMENTS
-- ===============================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  razorpay_order_id TEXT NULL,
  razorpay_payment_id TEXT NULL,
  razorpay_signature TEXT NULL,

  amount NUMERIC(10,2) NOT NULL,
  currency CHAR(3) NOT NULL,

  plan VARCHAR(10) NOT NULL,

  status VARCHAR(20) NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- PORTFOLIO / PROOF OF WORK
-- ===============================
-- Portfolio-specific layer over completed deals (brand, platform, amount,
-- currency and status are read from `deals` — never duplicated).
CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,

  campaign_title VARCHAR(150) NULL,
  deliverables TEXT[] NOT NULL DEFAULT '{}',
  completion_date DATE NULL,
  content_url TEXT NULL,
  thumbnail_url TEXT NULL,
  metrics JSONB NOT NULL DEFAULT '{}',
  creator_notes TEXT NULL,

  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT portfolio_items_user_deal_key UNIQUE (user_id, deal_id)
);

-- ===============================
-- CONTRACTS / CONTRACT MANAGEMENT
-- ===============================
-- One contract record per deal. Brand / platform / amount come
-- from `deals` via JOIN — never duplicated. "Signed" is
-- creator-marked tracking only (no e-signature infrastructure).
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,

  title VARCHAR(150) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'awaiting_signature'
    CHECK (status IN ('awaiting_signature', 'signed', 'expired')),
  signature_status VARCHAR(30) NOT NULL DEFAULT 'awaiting'
    CHECK (signature_status IN ('unsigned', 'awaiting', 'signed')),

  file_url TEXT NULL,
  file_name VARCHAR(255) NULL,

  notes TEXT NULL,

  signed_at DATE NULL,
  expires_at DATE NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT contracts_deal_key UNIQUE (deal_id)
);

-- ===============================
-- INBOUND COLLABORATION INQUIRIES
-- ===============================
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

-- ===============================
-- RATE INTELLIGENCE QUOTES
-- ===============================
CREATE TABLE IF NOT EXISTS rate_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quote_inputs JSONB NOT NULL DEFAULT '{}',
  quote_result JSONB NOT NULL DEFAULT '{}',
  negotiation_message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- DELIVERABLES
-- ===============================
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

-- ===============================
-- NOTIFICATION EVENT LEDGER
-- ===============================
CREATE TABLE IF NOT EXISTS notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_key TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  status TEXT NOT NULL DEFAULT 'sent',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, event_key, channel)
);

-- ===============================
-- IN-APP NOTIFICATIONS
-- ===============================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT NULL,
  entity_id UUID NULL,
  action_url TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_media_kit_public
  ON users(lower(username))
  WHERE media_kit_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_deals_user ON deals(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_deal_type ON deals(user_id, deal_type);
CREATE INDEX IF NOT EXISTS idx_deals_payment_due ON deals(payment_due_date);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_user ON portfolio_items(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_deal ON portfolio_items(deal_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_featured ON portfolio_items(user_id, is_featured);
CREATE INDEX IF NOT EXISTS idx_portfolio_public ON portfolio_items(user_id, is_public);
CREATE INDEX IF NOT EXISTS idx_contracts_user ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_deal ON contracts(deal_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_contracts_expires ON contracts(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_inbound_user ON inbound_inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inbound_status ON inbound_inquiries(user_id, status);
CREATE INDEX IF NOT EXISTS idx_inbound_created ON inbound_inquiries(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_rate_quotes_user ON rate_quotes(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_deliverables_user ON deliverables(user_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_deal ON deliverables(deal_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_status ON deliverables(user_id, status);
CREATE INDEX IF NOT EXISTS idx_deliverables_due ON deliverables(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_notification_events_user ON notification_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
