import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { applyIpAction, recentAdminActions } from '@/lib/admin-repository';
import {
  ADMIN_COOKIE,
  validMutationOrigin,
  verifyAdminSession,
} from '@/lib/security/auth';
import { resolveClientIp } from '@/lib/security/ip';

const schema = z.object({
  action: z.enum([
    'block_temporary',
    'block_indefinite',
    'unblock',
    'allowlist',
    'remove_allowlist',
    'approve_export',
    'reject_export',
  ]),
  ip: z.string().min(3).max(64),
  reason: z.string().max(500).optional().default(''),
  durationMinutes: z.coerce.number().int().min(5).max(43_200).optional(),
  returnTo: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = verifyAdminSession(request.cookies.get(ADMIN_COOKIE)?.value);
  if (!session) return new NextResponse(null, { status: 401 });
  if (!validMutationOrigin(request)) return new NextResponse(null, { status: 403 });

  const parsed = schema.safeParse(Object.fromEntries(await request.formData()));
  if (!parsed.success) return new NextResponse('Nieprawidłowe dane.', { status: 400 });

  const actorIp = resolveClientIp(request.headers);
  if (!actorIp) return new NextResponse('Nie można ustalić adresu administratora.', { status: 400 });
  if ((await recentAdminActions(actorIp)) >= 30) {
    return new NextResponse('Zbyt wiele działań. Spróbuj ponownie za minutę.', { status: 429 });
  }

  await applyIpAction({
    ...parsed.data,
    adminEmail: session.email,
    actorIp,
  });

  const returnPath = parsed.data.returnTo?.startsWith('/admin')
    ? parsed.data.returnTo
    : '/admin';
  return NextResponse.redirect(new URL(returnPath, request.url), 303);
}
