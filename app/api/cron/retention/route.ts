import { NextRequest, NextResponse } from 'next/server';

import { riskConfig } from '@/lib/config';
import { getDb } from '@/lib/db';
import { safeTokenEquals } from '@/lib/security/ip';

export async function POST(request: NextRequest) {
  const expected = process.env.CRON_SECRET ?? '';
  const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!expected || !safeTokenEquals(provided, expected)) {
    return new NextResponse(null, { status: 401 });
  }

  const sql = getDb();
  const result = await sql.begin(async (tx) => {
    const deleted = await tx`
      DELETE FROM visits
      WHERE created_at < now() - (${riskConfig.retentionDays} * interval '1 day')
      RETURNING id
    `;
    const expired = await tx`
      UPDATE ip_blocks SET active = false, updated_at = now()
      WHERE active = true AND indefinite = false AND expires_at <= now()
      RETURNING id
    `;
    return { deletedVisits: deleted.length, expiredBlocks: expired.length };
  });

  return NextResponse.json({ ok: true, ...result });
}
