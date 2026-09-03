import { isIP } from 'node:net';

import { getDb } from '@/lib/db';
import { hashIp } from '@/lib/security/ip';

export type VisitFilters = {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  campaign?: string;
  decision?: 'allow' | 'review' | 'block' | '';
  sort?: 'createdAt' | 'riskScore' | 'previousVisits';
  direction?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
};

export async function dashboardStats() {
  const sql = getDb();
  const [stats] = await sql<{
    visitsToday: number;
    uniqueIps: number;
    googleAdsVisits: number;
    suspiciousVisits: number;
    blockedVisits: number;
  }[]>`
    SELECT
      count(*) FILTER (WHERE created_at >= date_trunc('day', now()))::int AS "visitsToday",
      count(DISTINCT ip_hash) FILTER (WHERE created_at >= date_trunc('day', now()))::int AS "uniqueIps",
      count(*) FILTER (WHERE created_at >= date_trunc('day', now()) AND gclid IS NOT NULL)::int AS "googleAdsVisits",
      count(*) FILTER (WHERE created_at >= date_trunc('day', now()) AND decision = 'review')::int AS "suspiciousVisits",
      count(*) FILTER (WHERE created_at >= date_trunc('day', now()) AND decision = 'block')::int AS "blockedVisits"
    FROM visits
  `;
  return stats;
}

function normalizedFilters(filters: VisitFilters) {
  return {
    search: filters.search?.trim().slice(0, 100) || null,
    dateFrom: /^\d{4}-\d{2}-\d{2}$/.test(filters.dateFrom ?? '')
      ? filters.dateFrom!
      : null,
    dateTo: /^\d{4}-\d{2}-\d{2}$/.test(filters.dateTo ?? '')
      ? filters.dateTo!
      : null,
    campaign: filters.campaign?.trim().slice(0, 180) || null,
    decision: ['allow', 'review', 'block'].includes(filters.decision ?? '')
      ? filters.decision!
      : null,
    page: Math.max(1, filters.page ?? 1),
    pageSize: Math.min(100, Math.max(10, filters.pageSize ?? 25)),
    sort: filters.sort ?? 'createdAt',
    direction: filters.direction === 'asc' ? 'asc' : 'desc',
  };
}

export async function listVisits(filters: VisitFilters) {
  const sql = getDb();
  const normalized = normalizedFilters(filters);
  const sortColumn = {
    createdAt: 'created_at',
    riskScore: 'risk_score',
    previousVisits: 'previous_visits',
  }[normalized.sort];
  const offset = (normalized.page - 1) * normalized.pageSize;

  const where = sql`
    (${normalized.search}::text IS NULL OR ip::text ILIKE '%' || ${normalized.search} || '%')
    AND (${normalized.dateFrom}::date IS NULL OR created_at >= ${normalized.dateFrom}::date)
    AND (${normalized.dateTo}::date IS NULL OR created_at < ${normalized.dateTo}::date + interval '1 day')
    AND (${normalized.campaign}::text IS NULL OR utm_campaign ILIKE '%' || ${normalized.campaign} || '%')
    AND (${normalized.decision}::text IS NULL OR decision = ${normalized.decision})
  `;

  const [countRow] = await sql<{ total: number }[]>`
    SELECT count(*)::int AS total FROM visits WHERE ${where}
  `;

  const baseQuery = sql<{
    id: string;
    ip: string;
    createdAt: Date;
    source: string | null;
    utmCampaign: string | null;
    gclid: string | null;
    previousVisits: number;
    riskScore: number;
    decision: string;
    riskReasons: string[];
    blockStatus: string;
    manualReviewStatus: string;
    deviceType: string;
    country: string | null;
  }[]>`
    SELECT v.id, v.ip::text AS ip, v.created_at, v.source, v.utm_campaign, v.gclid,
      v.previous_visits, v.risk_score, v.decision, v.risk_reasons,
      CASE
        WHEN EXISTS(SELECT 1 FROM ip_allowlist a WHERE a.ip_hash = v.ip_hash AND a.active = true) THEN 'allowlisted'
        WHEN EXISTS(SELECT 1 FROM ip_blocks b WHERE b.ip_hash = v.ip_hash AND b.active = true AND b.starts_at <= now() AND (b.indefinite = true OR b.expires_at > now())) THEN 'blocked'
        ELSE v.block_status
      END AS block_status,
      manual_review_status, device_type, country
    FROM visits v
    WHERE ${where}
  `;

  const rows =
    normalized.direction === 'asc'
      ? await sql`${baseQuery} ORDER BY ${sql(sortColumn)} ASC LIMIT ${normalized.pageSize} OFFSET ${offset}`
      : await sql`${baseQuery} ORDER BY ${sql(sortColumn)} DESC LIMIT ${normalized.pageSize} OFFSET ${offset}`;

  return {
    rows,
    total: countRow.total,
    page: normalized.page,
    pageSize: normalized.pageSize,
    pages: Math.max(1, Math.ceil(countRow.total / normalized.pageSize)),
  };
}

export async function listCampaigns() {
  const sql = getDb();
  return sql<{ utmCampaign: string }[]>`
    SELECT DISTINCT utm_campaign
    FROM visits
    WHERE utm_campaign IS NOT NULL
    ORDER BY utm_campaign
    LIMIT 200
  `;
}

export type AdminIpAction =
  | 'block_temporary'
  | 'block_indefinite'
  | 'unblock'
  | 'allowlist'
  | 'remove_allowlist'
  | 'approve_export'
  | 'reject_export';

type IpActionInput = {
  action: AdminIpAction;
  ip: string;
  reason: string;
  durationMinutes?: number;
  adminEmail: string;
  actorIp: string;
};

export async function applyIpAction(input: IpActionInput) {
  if (!isIP(input.ip)) throw new Error('Nieprawidłowy adres IP.');
  const sql = getDb();
  const ipHash = hashIp(input.ip);
  const actorIpHash = hashIp(input.actorIp);
  const reason = input.reason.trim().slice(0, 500) || 'Decyzja administratora';
  const duration = Math.min(43_200, Math.max(5, input.durationMinutes ?? 60));

  await sql.begin(async (tx) => {
    if (input.action === 'block_temporary' || input.action === 'block_indefinite') {
      await tx`UPDATE ip_allowlist SET active = false, updated_at = now() WHERE ip_hash = ${ipHash} AND active = true`;
      await tx`UPDATE ip_blocks SET active = false, updated_at = now() WHERE ip_hash = ${ipHash} AND active = true`;
      await tx`
        INSERT INTO ip_blocks (
          ip, ip_hash, reason, source, starts_at, expires_at, indefinite, active, created_by
        ) VALUES (
          ${input.ip}::inet, ${ipHash}, ${reason}, 'manual', now(),
          ${input.action === 'block_indefinite' ? null : new Date(Date.now() + duration * 60_000)},
          ${input.action === 'block_indefinite'}, true, ${input.adminEmail}
        )
      `;
    } else if (input.action === 'unblock') {
      await tx`UPDATE ip_blocks SET active = false, updated_at = now() WHERE ip_hash = ${ipHash} AND active = true`;
    } else if (input.action === 'allowlist') {
      await tx`UPDATE ip_blocks SET active = false, updated_at = now() WHERE ip_hash = ${ipHash} AND active = true`;
      await tx`UPDATE ip_allowlist SET active = false, updated_at = now() WHERE ip_hash = ${ipHash} AND active = true`;
      await tx`
        INSERT INTO ip_allowlist (ip, ip_hash, reason, active, created_by)
        VALUES (${input.ip}::inet, ${ipHash}, ${reason}, true, ${input.adminEmail})
      `;
    } else if (input.action === 'remove_allowlist') {
      await tx`UPDATE ip_allowlist SET active = false, updated_at = now() WHERE ip_hash = ${ipHash} AND active = true`;
    } else if (input.action === 'approve_export') {
      await tx`UPDATE visits SET manual_review_status = 'approved' WHERE ip_hash = ${ipHash}`;
    } else if (input.action === 'reject_export') {
      await tx`UPDATE visits SET manual_review_status = 'rejected' WHERE ip_hash = ${ipHash}`;
    }

    await tx`
      INSERT INTO admin_audit_log (
        admin_email, action, target_ip, actor_ip_hash, success, details
      ) VALUES (
        ${input.adminEmail}, ${input.action}, ${input.ip}::inet, ${actorIpHash}, true,
        ${tx.json({ reason, durationMinutes: duration })}
      )
    `;
  });
}

export async function recordAdminAudit(input: {
  adminEmail?: string | null;
  action: string;
  actorIp?: string | null;
  success: boolean;
  details?: Record<string, string | number | boolean | null>;
}) {
  const sql = getDb();
  const actorIpHash =
    input.actorIp && isIP(input.actorIp) ? hashIp(input.actorIp) : null;
  await sql`
    INSERT INTO admin_audit_log (admin_email, action, actor_ip_hash, success, details)
    VALUES (
      ${input.adminEmail ?? null}, ${input.action}, ${actorIpHash}, ${input.success},
      ${sql.json(input.details ?? {})}
    )
  `;
}

export async function recentFailedLogins(actorIp: string) {
  const sql = getDb();
  const ipHash = hashIp(actorIp);
  const [row] = await sql<{ count: number }[]>`
    SELECT count(*)::int AS count
    FROM admin_audit_log
    WHERE action = 'admin_login'
      AND success = false
      AND actor_ip_hash = ${ipHash}
      AND created_at >= now() - interval '15 minutes'
  `;
  return row.count;
}

export async function recentAdminActions(actorIp: string) {
  const sql = getDb();
  const ipHash = hashIp(actorIp);
  const [row] = await sql<{ count: number }[]>`
    SELECT count(*)::int AS count
    FROM admin_audit_log
    WHERE actor_ip_hash = ${ipHash}
      AND created_at >= now() - interval '1 minute'
  `;
  return row.count;
}

export type ApprovedIpReportRow = {
  ip: string;
  visitCount: number;
  campaignCount: number;
  firstVisit: Date;
  lastVisit: Date;
  gclids: string | null;
  riskScore: number;
  reasons: string;
  reviewStatus: string;
};

export async function approvedIpReport() {
  const sql = getDb();
  return sql<ApprovedIpReportRow[]>`
    WITH aggregate_visits AS (
      SELECT
        ip,
        count(*)::int AS visit_count,
        count(DISTINCT utm_campaign)::int AS campaign_count,
        min(created_at) AS first_visit,
        max(created_at) AS last_visit,
        string_agg(DISTINCT gclid, ' | ') FILTER (WHERE gclid IS NOT NULL) AS gclids,
        max(risk_score)::int AS risk_score
      FROM visits
      WHERE manual_review_status = 'approved'
      GROUP BY ip
    ), aggregate_reasons AS (
      SELECT v.ip, string_agg(DISTINCT reason, ' | ') AS reasons
      FROM visits v
      CROSS JOIN LATERAL unnest(v.risk_reasons) AS reason
      WHERE v.manual_review_status = 'approved'
      GROUP BY v.ip
    )
    SELECT
      a.ip::text AS ip,
      a.visit_count AS "visitCount",
      a.campaign_count AS "campaignCount",
      a.first_visit AS "firstVisit",
      a.last_visit AS "lastVisit",
      a.gclids,
      a.risk_score AS "riskScore",
      coalesce(r.reasons, '') AS reasons,
      'approved'::text AS "reviewStatus"
    FROM aggregate_visits a
    LEFT JOIN aggregate_reasons r ON r.ip = a.ip
    ORDER BY a.risk_score DESC, a.visit_count DESC
  `;
}
