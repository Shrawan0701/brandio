-- =============================================================================
-- BRANDIO · MIGRATION 001 — RECONCILE LIVE SCHEMA
-- =============================================================================
-- WHY THIS FILE EXISTS
--   ../schema.sql is the ORIGINAL baseline and is OUT OF SYNC with the live
--   PostgreSQL database. Verified against the live DB (public schema):
--   only `users`, `deals`, `payments` exist, and these three columns are
--   already used by the running backend / frontend but were never added to
--   schema.sql:
--
--     deals.proof_images      TEXT[]      -- Cloudinary proof screenshots (Pro)
--     users.reset_otp         VARCHAR     -- password reset OTP
--     users.reset_otp_expiry  TIMESTAMP   -- password reset OTP expiry
--
--   Running schema.sql on a fresh database today would produce a schema that
--   BREAKS the app (forgot-password + deal proof images). This migration fixes
--   that gap without touching the existing production data.
--
-- SAFETY
--   * Additive + idempotent only (ADD COLUMN IF NOT EXISTS).
--   * No DROP / RENAME / type changes / data rewrites.
--   * Safe to run on the live database and on a fresh one.
--
-- HOW TO RUN (from the brandioo-main folder)
--   psql "$DATABASE_URL" -f src/sql/migrations/001_reconcile_live_schema.sql
--   (or paste into the pgAdmin / Neon / Supabase SQL editor)
-- =============================================================================

-- ---------------------------------------------------------------- deals ----
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS proof_images TEXT[] NOT NULL DEFAULT '{}';

-- ---------------------------------------------------------------- users ----
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(10);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reset_otp_expiry TIMESTAMP;

-- ------------------------------------------------- indexes (idempotent) ----
CREATE INDEX IF NOT EXISTS idx_users_email         ON users(email);
CREATE INDEX IF NOT EXISTS idx_deals_user          ON deals(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_status        ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_payment_due   ON deals(payment_due_date);
CREATE INDEX IF NOT EXISTS idx_payments_user       ON payments(user_id);

-- =============================================================================
-- ROADMAP — NOT EXECUTED BY THIS MIGRATION (documented direction only)
-- =============================================================================
-- Brandio moves from "deal tracker" to full lifecycle:
--   discovery -> negotiation -> deal -> contract -> deliverables -> submission
--   -> approval -> publishing -> performance -> invoice -> payment -> repeat
--
-- Planned schema extensions (each will ship as its own numbered migration so
-- every step is reviewable and reversible):
--
--   MIGRATION 002 · DEAL PIPELINE
--     ALTER TABLE deals
--       ADD COLUMN stage VARCHAR(30) NOT NULL DEFAULT 'negotiation',
--       ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--       ADD COLUMN description TEXT,
--       ADD COLUMN notes TEXT,
--       ADD COLUMN brand_id UUID,          -- FK -> brands(id) (nullable, backfilled)
--       ADD COLUMN source VARCHAR(30),      -- inbound / outreach / referral
--       ADD COLUMN exclusivity VARCHAR(20),
--       ADD COLUMN usage_rights TEXT,
--       ADD COLUMN payment_received_at DATE;
--     -- `status` stays the money state (pending/active/completed/overdue) so all
--     -- existing queries, filters, cron jobs and analytics keep working.
--
--   MIGRATION 003 · BRANDS (relationship history / CRM)
--     CREATE TABLE brands (id, user_id, name, website, industry, contact_name,
--       contact_email, country_code, notes, created_at);
--     CREATE UNIQUE INDEX ON brands(user_id, lower(name));
--
--   MIGRATION 004 · CONTRACTS + DELIVERABLES
--     CREATE TABLE contracts (id, deal_id, file_url, status, signed_at, created_at);
--     CREATE TABLE deliverables (id, deal_id, type, platform, quantity,
--       due_date, status, approved_at);
--
--   MIGRATION 005 · INVOICES
--     CREATE TABLE invoices (id, user_id, deal_id, invoice_number UNIQUE,
--       subtotal, tax, total, currency, status, issued_at, paid_at, pdf_url);
--
--   MIGRATION 006 · ACTIVITY / TIMELINE
--     CREATE TABLE activities (id, user_id, deal_id, type, message, meta JSONB,
--       created_at);
--
--   MIGRATION 007 · PERFORMANCE
--     CREATE TABLE content_metrics (id, deal_id, views, likes, comments,
--       saves, shares, engagement_rate, captured_at);
--
-- Every table follows the existing conventions:
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   plus an idx_<table>_user index.
-- =============================================================================