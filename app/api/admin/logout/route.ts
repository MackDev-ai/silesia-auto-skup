import { NextRequest, NextResponse } from 'next/server';

import { recordAdminAudit } from '@/lib/admin-repository';
import {
  ADMIN_COOKIE,
  validMutationOrigin,
  verifyAdminSession,
} from '@/lib/security/auth';
import { resolveClientIp } from '@/lib/security/ip';

export async function POST(request: NextRequest) {
  if (!validMutationOrigin(request)) return new NextResponse(null, { status: 403 });
  const session = verifyAdminSession(request.cookies.get(ADMIN_COOKIE)?.value);
  if (session) {
    await recordAdminAudit({
      adminEmail: session.email,
      action: 'admin_logout',
      actorIp: resolveClientIp(request.headers),
      success: true,
    });
  }
  const response = NextResponse.redirect(new URL('/admin/login', request.url), 303);
  response.cookies.set(ADMIN_COOKIE, '', { maxAge: 0, path: '/' });
  return response;
}
