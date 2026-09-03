import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  recentFailedLogins,
  recordAdminAudit,
} from '@/lib/admin-repository';
import { databaseConfigured } from '@/lib/db';
import {
  ADMIN_COOKIE,
  createAdminSession,
  SESSION_TTL_SECONDS,
  validMutationOrigin,
  verifyPassword,
} from '@/lib/security/auth';
import { resolveClientIp, safeTokenEquals } from '@/lib/security/ip';

const schema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(300),
});

export async function POST(request: NextRequest) {
  if (!validMutationOrigin(request)) {
    return NextResponse.json({ error: 'Nieprawidłowe źródło żądania.' }, { status: 403 });
  }
  const ip = resolveClientIp(request.headers);
  if (!ip) {
    return NextResponse.redirect(new URL('/admin/login?error=infrastructure', request.url), 303);
  }
  const formData = await request.formData();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return NextResponse.redirect(new URL('/admin/login?error=invalid', request.url), 303);
  }

  if (!databaseConfigured()) {
    return NextResponse.redirect(new URL('/admin/login?error=database', request.url), 303);
  }

  if ((await recentFailedLogins(ip)) >= 8) {
    return NextResponse.redirect(new URL('/admin/login?error=rate', request.url), 303);
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? '';
  const passwordHash = process.env.ADMIN_PASSWORD_HASH ?? '';
  const emailMatches = safeTokenEquals(parsed.data.email, adminEmail);
  const passwordMatches = passwordHash
    ? verifyPassword(parsed.data.password, passwordHash)
    : false;
  const success = emailMatches && passwordMatches;

  await recordAdminAudit({
    adminEmail: success ? adminEmail : parsed.data.email,
    action: 'admin_login',
    actorIp: ip,
    success,
    details: { userAgent: request.headers.get('user-agent')?.slice(0, 300) ?? null },
  });

  if (!success) {
    return NextResponse.redirect(new URL('/admin/login?error=credentials', request.url), 303);
  }

  const response = NextResponse.redirect(new URL('/admin', request.url), 303);
  response.cookies.set(ADMIN_COOKIE, createAdminSession(adminEmail), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_TTL_SECONDS,
    path: '/',
  });
  return response;
}
