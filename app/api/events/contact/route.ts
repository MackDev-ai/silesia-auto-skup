import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { validMutationOrigin } from '@/lib/security/auth';
import { resolveClientIp } from '@/lib/security/ip';
import { recordContactAction } from '@/lib/security/monitor';

const schema = z.object({
  action: z.enum(['phone_click', 'whatsapp_click']),
});

export async function POST(request: NextRequest) {
  if (!validMutationOrigin(request)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  const ip = resolveClientIp(request.headers);
  if (!ip) return NextResponse.json({ ok: false }, { status: 400 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const visitId = request.cookies.get('sas_visit_id')?.value;
  const safeVisitId =
    visitId && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(visitId) ? visitId : null;
  const result = await recordContactAction(ip, safeVisitId, parsed.data.action);
  if (result === 'rate_limited') {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  return NextResponse.json({ ok: true });
}
