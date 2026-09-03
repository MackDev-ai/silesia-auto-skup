import { NextRequest, NextResponse } from 'next/server';

import {
  approvedIpReport,
  recordAdminAudit,
  type ApprovedIpReportRow,
} from '@/lib/admin-repository';
import { ADMIN_COOKIE, verifyAdminSession } from '@/lib/security/auth';
import { resolveClientIp } from '@/lib/security/ip';

export const csvCell = (value: unknown) =>
  `"${String(value ?? '').replaceAll('"', '""').replace(/^[=+\-@]/, "'$&")}"`;

export function buildApprovedCsv(
  rows: readonly ApprovedIpReportRow[],
) {
  const header = [
    'IP', 'Liczba wejść', 'Liczba kampanii', 'Pierwsza wizyta',
    'Ostatnia wizyta', 'GCLID', 'Ocena ryzyka', 'Powód oznaczenia',
    'Status weryfikacji',
  ];
  const body = rows.map((row) =>
    [
      row.ip, row.visitCount, row.campaignCount, row.firstVisit.toISOString(),
      row.lastVisit.toISOString(), row.gclids, row.riskScore, row.reasons,
      row.reviewStatus,
    ].map(csvCell).join(','),
  );
  return `\ufeff${[header.map(csvCell).join(','), ...body].join('\r\n')}`;
}

export async function GET(request: NextRequest) {
  const session = verifyAdminSession(request.cookies.get(ADMIN_COOKIE)?.value);
  if (!session) return new NextResponse(null, { status: 401 });

  const rows = await approvedIpReport();

  await recordAdminAudit({
    adminEmail: session.email,
    action: 'export_approved_ips_csv',
    actorIp: resolveClientIp(request.headers),
    success: true,
    details: { rowCount: rows.length },
  });

  return new NextResponse(buildApprovedCsv(rows), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="silesia-auto-skup-ip-review-${new Date().toISOString().slice(0, 10)}.csv"`,
      'cache-control': 'private, no-store',
    },
  });
}
