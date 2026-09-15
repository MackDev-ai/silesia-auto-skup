import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { recentFailedLogins, recordAdminAudit } from '@/lib/admin-repository';
import { findActiveViewerByEmail, recordViewerLogin } from '@/lib/admin-users';
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
    return NextResponse.json(
      { error: 'Nieprawidłowe źródło żądania.' },
      { status: 403 },
    );
  }
  const ip = resolveClientIp(request.headers);
  if (!ip) {
    return NextResponse.redirect(
      new URL('/admin/login?error=infrastructure', request.url),
      303,
    );
  }
  const formData = await request.formData();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return NextResponse.redirect(
      new URL('/admin/login?error=invalid', request.url),
      303,
    );
  }

  if (!databaseConfigured()) {
    return NextResponse.redirect(
      new URL('/admin/login?error=database', request.url),
      303,
    );
  }

  if ((await recentFailedLogins(ip)) >= 8) {
    return NextResponse.redirect(
      new URL('/admin/login?error=rate', request.url),
      303,
    );
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? '';
  const passwordHash = process.env.ADMIN_PASSWORD_HASH ?? '';
  const normalizedEmail = parsed.data.email.trim().toLowerCase();
  const ownerEmailMatches = safeTokenEquals(
    normalizedEmail,
    adminEmail.toLowerCase(),
  );
  const ownerPasswordMatches = passwordHash
    ? verifyPassword(parsed.data.password, passwordHash)
    : false;
  const ownerSuccess = ownerEmailMatches && ownerPasswordMatches;

  const viewer = ownerSuccess
    ? null
    : await findActiveViewerByEmail(normalizedEmail);
  const viewerSuccess = viewer
    ? verifyPassword(parsed.data.password, viewer.passwordHash)
    : false;
  const success = ownerSuccess || viewerSuccess;
  const authenticatedEmail = ownerSuccess
    ? adminEmail
    : (viewer?.email ?? normalizedEmail);
  const authenticatedRole = ownerSuccess ? 'owner' : 'viewer';

  await recordAdminAudit({
    adminEmail: success ? authenticatedEmail : normalizedEmail,
    action: 'admin_login',
    actorIp: ip,
    success,
    details: {
      userAgent: request.headers.get('user-agent')?.slice(0, 300) ?? null,
      role: success ? authenticatedRole : null,
    },
  });

  if (!success) {
    return NextResponse.redirect(
      new URL('/admin/login?error=credentials', request.url),
      303,
    );
  }

  if (viewerSuccess && viewer) await recordViewerLogin(viewer.id);

  const response = NextResponse.redirect(new URL('/admin', request.url), 303);
  response.cookies.set(
    ADMIN_COOKIE,
    createAdminSession(
      authenticatedEmail,
      authenticatedRole,
      viewerSuccess && viewer ? viewer.id : null,
    ),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_TTL_SECONDS,
      path: '/',
    },
  );
  return response;
}
