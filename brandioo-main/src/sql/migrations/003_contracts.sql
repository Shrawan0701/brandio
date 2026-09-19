-- =============================================================================
-- BRANDIO · MIGRATION 003 — CONTRACTS + CONTRACT MANAGEMENT
-- =============================================================================
-- WHY
--   A deal should be able to carry its contract. `contracts` stores ONE
--   contract record per deal (contracts_deal_key) and joins `deals` for
--   brand_name / platform / amount / currency — those are never duplicated.
--
--   Contract-specific layer stored here:
--     title / status / signature_status / file_url / file_name /
--     notes / signed_at / expires_at
--
--   STATUS MODEL (deliberately simple — tracking foundation, NOT e-signing)
--     status:           awaiting_signature | signed | expired
--     signature_status: unsigned | awaiting | signed
--   The backend keeps the two in sync (signed <-> signed, awaiting/unsigned
--   <-> awaiting_signature). There is NO cryptographic e-signature
--   infrastructure in this project yet — "signed" means the creator marked
--   the paperwork as signed. A real e-sign provider can be added later
--   without changing this schema (add e.g. provider, envelope_id columns).
--
-- SAFETY
--   * Additive + idempotent only. No DROP / ALTER of existing tables.
--   * Deleting a deal cascades to its contract; deleting a user cascades too.
--
-- HOW TO RUN (from the brandioo-main folder)
--   psql "$DATABASE_URL" -f src/sql/migrations/003_contracts.sql
--   (or paste into the pgAdmin / Neon / Supabase SQL editor)
-- =============================================================================

CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,

  -- contract-specific layer (brand/platform/amount come from deals via JOIN)
  title VARCHAR(150) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'awaiting_signature'
    CHECK (status IN ('awaiting_signature', 'signed', 'expired')),
  signature_status VARCHAR(30) NOT NULL DEFAULT 'awaiting'
    CHECK (signature_status IN ('unsigned', 'awaiting', 'signed')),

  -- document reference (Cloudinary signed upload, same approach as deal proofs)
  file_url TEXT NULL,
  file_name VARCHAR(255) NULL,

  notes TEXT NULL,

  signed_at DATE NULL,
  expires_at DATE NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT contracts_deal_key UNIQUE (deal_id)
);

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS deal_id UUID REFERENCES deals(id) ON DELETE CASCADE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS title VARCHAR(150);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'awaiting_signature';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signature_status VARCHAR(30) NOT NULL DEFAULT 'awaiting';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS file_url TEXT NULL;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS file_name VARCHAR(255) NULL;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS notes TEXT NULL;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signed_at DATE NULL;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS expires_at DATE NULL;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

UPDATE contracts c
SET user_id = d.user_id
FROM deals d
WHERE c.deal_id = d.id AND c.user_id IS NULL;

UPDATE contracts
SET title = 'Contract'
WHERE title IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contracts_deal_key'
  ) THEN
    ALTER TABLE contracts ADD CONSTRAINT contracts_deal_key UNIQUE (deal_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_contracts_user        ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_deal        ON contracts(deal_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status      ON contracts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_contracts_expires     ON contracts(user_id, expires_at);
