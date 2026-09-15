CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(320) NOT NULL,
  password_hash text NOT NULL,
  role varchar(20) NOT NULL DEFAULT 'viewer'
    CHECK (role IN ('viewer')),
  active boolean NOT NULL DEFAULT true,
  created_by varchar(320) NOT NULL,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_email_unique
  ON admin_users (lower(email));
CREATE INDEX IF NOT EXISTS idx_admin_users_active
  ON admin_users (active, created_at DESC);
