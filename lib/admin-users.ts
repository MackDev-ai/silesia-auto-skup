import { getDb } from '@/lib/db';
import type { AdminSession } from '@/lib/security/auth';

export type ViewerAccount = {
  id: string;
  email: string;
  role: 'viewer';
  active: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
};

function isMissingAdminUsersTable(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '42P01'
  );
}

async function ensureAdminUsersTable() {
  const sql = getDb();
  await sql`
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
    )
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_email_unique
      ON admin_users (lower(email))
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_admin_users_active
      ON admin_users (active, created_at DESC)
  `;
}

export async function findActiveViewerByEmail(email: string) {
  const sql = getDb();
  try {
    const [user] = await sql<
      {
        id: string;
        email: string;
        passwordHash: string;
        role: 'viewer';
      }[]
    >`
      SELECT id, email, password_hash, role
      FROM admin_users
      WHERE lower(email) = lower(${email}) AND active = true
      LIMIT 1
    `;
    return user ?? null;
  } catch (error) {
    if (isMissingAdminUsersTable(error)) return null;
    throw error;
  }
}

export async function authorizeAdminSession(session: AdminSession | null) {
  if (!session) return null;
  if (session.role === 'owner') return session;

  const sql = getDb();
  const [user] = await sql<{ id: string; email: string; role: 'viewer' }[]>`
    SELECT id, email, role
    FROM admin_users
    WHERE id = ${session.userId}::uuid
      AND lower(email) = lower(${session.email})
      AND role = 'viewer'
      AND active = true
    LIMIT 1
  `;
  return user ? session : null;
}

export async function recordViewerLogin(userId: string) {
  const sql = getDb();
  await sql`
    UPDATE admin_users
    SET last_login_at = now(), updated_at = now()
    WHERE id = ${userId}::uuid
  `;
}

export async function listViewerAccounts() {
  const sql = getDb();
  try {
    return await sql<ViewerAccount[]>`
      SELECT id, email, role, active, last_login_at, created_at
      FROM admin_users
      ORDER BY active DESC, created_at DESC
    `;
  } catch (error) {
    if (isMissingAdminUsersTable(error)) return [];
    throw error;
  }
}

export async function createOrReactivateViewer(input: {
  email: string;
  passwordHash: string;
  createdBy: string;
}) {
  const sql = getDb();
  const upsert = async () => {
    const [user] = await sql<{ id: string; email: string }[]>`
      INSERT INTO admin_users (email, password_hash, role, active, created_by)
      VALUES (lower(${input.email}), ${input.passwordHash}, 'viewer', true, ${input.createdBy})
      ON CONFLICT (lower(email)) DO UPDATE SET
        password_hash = excluded.password_hash,
        active = true,
        updated_at = now()
      RETURNING id, email
    `;
    return user;
  };

  try {
    return await upsert();
  } catch (error) {
    if (!isMissingAdminUsersTable(error)) throw error;
    await ensureAdminUsersTable();
    return upsert();
  }
}

export async function deactivateViewer(userId: string) {
  const sql = getDb();
  const [user] = await sql<{ id: string; email: string }[]>`
    UPDATE admin_users
    SET active = false, updated_at = now()
    WHERE id = ${userId}::uuid AND role = 'viewer'
    RETURNING id, email
  `;
  return user ?? null;
}
