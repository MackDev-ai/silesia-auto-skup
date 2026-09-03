import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

import { requireEnvironment, siteConfig } from '@/lib/config';

export const ADMIN_COOKIE = 'sas_admin_session';
export const SESSION_TTL_SECONDS = 8 * 60 * 60;
export const PBKDF2_ITERATIONS = 100_000;

type SessionPayload = {
  email: string;
  exp: number;
  nonce: string;
};

function sign(value: string) {
  return createHmac('sha256', requireEnvironment('SESSION_SECRET'))
    .update(value)
    .digest('base64url');
}

export function createAdminSession(email: string) {
  const payload: SessionPayload = {
    email,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    nonce: randomBytes(16).toString('hex'),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

export function verifyAdminSession(token?: string | null) {
  if (!token) return null;
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;
  let expected: Buffer;
  try {
    expected = Buffer.from(sign(encoded));
  } catch {
    return null;
  }
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }
  try {
    const payload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    ) as SessionPayload;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    if (payload.email !== requireEnvironment('ADMIN_EMAIL')) return null;
    return payload;
  } catch {
    return null;
  }
}

export function verifyPassword(password: string, storedHash: string) {
  const [algorithm, iterationsRaw, salt, expectedRaw] = storedHash.split('$');
  if (algorithm !== 'pbkdf2_sha256' || !iterationsRaw || !salt || !expectedRaw) {
    return false;
  }
  const iterations = Number.parseInt(iterationsRaw, 10);
  if (
    !Number.isSafeInteger(iterations) ||
    iterations < PBKDF2_ITERATIONS ||
    iterations > PBKDF2_ITERATIONS
  ) {
    return false;
  }
  const expected = Buffer.from(expectedRaw, 'base64url');
  const actual = pbkdf2Sync(password, salt, iterations, expected.length, 'sha256');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function passwordHashForSetup(password: string) {
  const iterations = PBKDF2_ITERATIONS;
  const salt = randomBytes(18).toString('base64url');
  const hash = pbkdf2Sync(password, salt, iterations, 32, 'sha256');
  return `pbkdf2_sha256$${iterations}$${salt}$${hash.toString('base64url')}`;
}

export function validMutationOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const expectedOrigin = siteConfig.siteUrl || new URL(request.url).origin;
    return new URL(origin).origin === expectedOrigin;
  } catch {
    return false;
  }
}
