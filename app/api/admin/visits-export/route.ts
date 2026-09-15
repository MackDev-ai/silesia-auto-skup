import { NextRequest } from 'next/server';

import {
  exportVisitLogs,
  recordAdminAudit,
  type VisitFilters,
  type VisitLogExportRow,
} from '@/lib/admin-repository';
import { authorizeAdminSession } from '@/lib/admin-users';
import { csvCell } from '@/lib/csv';
import { ADMIN_COOKIE, verifyAdminSession } from '@/lib/security/auth';
import { resolveClientIp } from '@/lib/security/ip';

const polishTime = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Warsaw',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

const dateValue = (date: Date | null) => (date ? date.toISOString() : '');

export function buildVisitLogsCsv(rows: readonly VisitLogExportRow[]) {
  const header = [
    'Czas Polska',
    'Czas UTC',
    'IP',
    'Skrót IP',
    'Ścieżka',
    'Strona wejścia',
    'Źródło',
    'Referrer',
    'UTM source',
    'UTM medium',
    'UTM campaign',
    'UTM term',
    'UTM content',
    'GCLID',
    'User-Agent',
    'Urządzenie',
    'Kraj',
    'Numer wizyty z IP',
    'Ocena ryzyka',
    'Decyzja',
    'Przyczyny',
    'Status blokady',
    'Status weryfikacji',
    'Akcja kontaktowa',
    'Czas akcji kontaktowej UTC',
  ];
  const body = rows.map((row) =>
    [
      polishTime.format(row.createdAt),
      row.createdAt.toISOString(),
      row.ip,
      row.ipHash,
      row.visitedPath,
      row.landingPage,
      row.source,
      row.referrer,
      row.utmSource,
      row.utmMedium,
      row.utmCampaign,
      row.utmTerm,
      row.utmContent,
      row.gclid,
      row.userAgent,
      row.deviceType,
      row.country,
      row.previousVisits + 1,
      row.riskScore,
      row.decision,
      row.riskReasons.join(' | '),
      row.blockStatus,
      row.manualReviewStatus,
      row.contactAction,
      dateValue(row.contactClickedAt),
    ]
      .map(csvCell)
      .join(','),
  );
  return `\ufeff${[header.map(csvCell).join(','), ...body].join('\r\n')}`;
}

function queryFilters(request: NextRequest): VisitFilters {
  const params = request.nextUrl.searchParams;
  return {
    search: params.get('search') ?? undefined,
    dateFrom: params.get('dateFrom') ?? undefined,
    dateTo: params.get('dateTo') ?? undefined,
    campaign: params.get('campaign') ?? undefined,
    decision: (params.get('decision') ?? '') as VisitFilters['decision'],
    sort: (params.get('sort') ?? 'createdAt') as VisitFilters['sort'],
    direction: (params.get('direction') ?? 'desc') as VisitFilters['direction'],
  };
}

export async function GET(request: NextRequest) {
  const signedSession = verifyAdminSession(
    request.cookies.get(ADMIN_COOKIE)?.value,
  );
  const session = await authorizeAdminSession(signedSession);
  if (!session) return new Response(null, { status: 401 });

  const result = await exportVisitLogs(queryFilters(request));
  await recordAdminAudit({
    adminEmail: session.email,
    action: 'export_visit_logs_csv',
    actorIp: resolveClientIp(request.headers),
    success: true,
    details: {
      rowCount: result.rows.length,
      truncated: result.truncated,
      dateFrom: result.normalized.dateFrom,
      dateTo: result.normalized.dateTo,
      campaign: result.normalized.campaign,
      decision: result.normalized.decision,
    },
  });

  const range =
    [result.normalized.dateFrom, result.normalized.dateTo]
      .filter(Boolean)
      .join('_') || new Date().toISOString().slice(0, 10);
  return new Response(buildVisitLogsCsv(result.rows), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="silesia-auto-skup-logi-${range}.csv"`,
      'cache-control': 'private, no-store',
      'x-export-truncated': String(result.truncated),
    },
  });
}
