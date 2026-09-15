import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { recordAdminAudit, recentAdminActions } from '@/lib/admin-repository';
import { createOrReactivateViewer, deactivateViewer } from '@/lib/admin-users';
import {
  ADMIN_COOKIE,
  passwordHashForSetup,
  validMutationOrigin,
  verifyAdminSession,
} from '@/lib/security/auth';
import { resolveClientIp, safeTokenEquals } from '@/lib/security/ip';

const createSchema = z.object({
  action: z.literal('create_viewer'),
  email: z.string().email().max(320),
  password: z.string().min(14).max(300),
});

const deactivateSchema = z.object({
  action: z.literal('deactivate_viewer'),
  userId: z.string().uuid(),
});

const schema = z.discriminatedUnion('action', [createSchema, deactivateSchema]);

export async function POST(request: NextRequest) {
  const session = verifyAdminSession(request.cookies.get(ADMIN_COOKIE)?.value);
  if (!session) return new NextResponse(null, { status: 401 });
  if (session.role !== 'owner') return new NextResponse(null, { status: 403 });
  if (!validMutationOrigin(request))
    return new NextResponse(null, { status: 403 });

  const actorIp = resolveClientIp(request.headers);
  if (!actorIp)
    return new NextResponse('Nie można ustalić adresu administratora.', {
      status: 400,
    });
  if ((await recentAdminActions(actorIp)) >= 30) {
    return new NextResponse('Zbyt wiele działań. Spróbuj ponownie za minutę.', {
      status: 429,
    });
  }

  const parsed = schema.safeParse(Object.fromEntries(await request.formData()));
  if (!parsed.success) {
    return NextResponse.redirect(
      new URL('/admin?accountError=invalid', request.url),
      303,
    );
  }

  if (parsed.data.action === 'create_viewer') {
    const email = parsed.data.email.trim().toLowerCase();
    const ownerEmail = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
    if (ownerEmail && safeTokenEquals(email, ownerEmail)) {
      return NextResponse.redirect(
        new URL('/admin?accountError=owner', request.url),
        303,
      );
    }
    const viewer = await createOrReactivateViewer({
      email,
      passwordHash: passwordHashForSetup(parsed.data.password),
      createdBy: session.email,
    });
    await recordAdminAudit({
      adminEmail: session.email,
      action: 'create_or_reactivate_viewer',
      actorIp,
      success: true,
      details: { viewerId: viewer.id, viewerEmail: viewer.email },
    });
    return NextResponse.redirect(
      new URL('/admin?accountCreated=1', request.url),
      303,
    );
  }

  const viewer = await deactivateViewer(parsed.data.userId);
  await recordAdminAudit({
    adminEmail: session.email,
    action: 'deactivate_viewer',
    actorIp,
    success: Boolean(viewer),
    details: {
      viewerId: parsed.data.userId,
      viewerEmail: viewer?.email ?? null,
    },
  });
  return NextResponse.redirect(
    new URL('/admin?accountDeactivated=1', request.url),
    303,
  );
}
