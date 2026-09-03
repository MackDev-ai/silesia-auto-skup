CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip inet NOT NULL,
  ip_hash char(64) NOT NULL,
  visited_path varchar(500) NOT NULL,
  landing_page varchar(1500),
  source varchar(160),
  referrer varchar(1000),
  utm_source varchar(120),
  utm_medium varchar(120),
  utm_campaign varchar(180),
  utm_term varchar(180),
  utm_content varchar(180),
  gclid varchar(250),
  user_agent varchar(700),
  device_type varchar(20) NOT NULL DEFAULT 'unknown'
    CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'bot', 'unknown')),
  country char(2),
  previous_visits integer NOT NULL DEFAULT 0,
  risk_score integer NOT NULL DEFAULT 0 CHECK (risk_score >= 0),
  decision varchar(10) NOT NULL DEFAULT 'allow'
    CHECK (decision IN ('allow', 'review', 'block')),
  risk_reasons text[] NOT NULL DEFAULT ARRAY[]::text[],
  block_status varchar(20) NOT NULL DEFAULT 'none'
    CHECK (block_status IN ('none', 'allowlisted', 'manual_blocked', 'auto_blocked')),
  manual_review_status varchar(20) NOT NULL DEFAULT 'unreviewed'
    CHECK (manual_review_status IN ('unreviewed', 'approved', 'rejected')),
  contact_action varchar(30),
  contact_clicked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ip_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip inet NOT NULL,
  ip_hash char(64) NOT NULL,
  reason text NOT NULL,
  source varchar(20) NOT NULL CHECK (source IN ('manual', 'automatic')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  indefinite boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_by varchar(320),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (indefinite = true OR expires_at IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS ip_allowlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip inet NOT NULL,
  ip_hash char(64) NOT NULL,
  reason text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_by varchar(320) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS risk_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid REFERENCES visits(id) ON DELETE CASCADE,
  ip_hash char(64) NOT NULL,
  event_type varchar(100) NOT NULL,
  points integer,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email varchar(320),
  action varchar(100) NOT NULL,
  target_ip inet,
  actor_ip_hash char(64),
  success boolean NOT NULL DEFAULT true,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visits_ip_hash_created ON visits (ip_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_ip_created ON visits (ip, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_created ON visits (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_decision_created ON visits (decision, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_campaign_created ON visits (utm_campaign, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_gclid_created ON visits (gclid, created_at DESC) WHERE gclid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_visits_block_status ON visits (block_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_review_status ON visits (manual_review_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ip_blocks_hash_active ON ip_blocks (ip_hash, active, expires_at);
CREATE INDEX IF NOT EXISTS idx_ip_blocks_created ON ip_blocks (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ip_allowlist_hash_active ON ip_allowlist (ip_hash, active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ip_allowlist_one_active
  ON ip_allowlist (ip_hash) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_risk_events_hash_created ON risk_events (ip_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_events_visit ON risk_events (visit_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target_ip ON admin_audit_log (target_ip, created_at DESC);
