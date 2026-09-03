import { databaseConfigured, getDb } from '@/lib/db';
import { extractCampaignData } from '@/lib/campaign';
import { hashIp, verifySearchBot } from '@/lib/security/ip';
import {
  detectDeviceType,
  evaluateRisk,
  type RiskDecision,
} from '@/lib/security/risk';
import { riskConfig } from '@/lib/config';

export type MonitorInput = {
  ip: string;
  url: URL;
  userAgent: string;
  referrer: string;
  country: string | null;
  infrastructureDatacenterSignal?: boolean;
};

export type MonitorResult = {
  visitId: string | null;
  decision: RiskDecision;
  score: number;
  reasons: string[];
};

const limited = (value: string | null | undefined, max = 500) =>
  value ? value.trim().slice(0, max) : null;

function pointsForReason(reason: string, totalScore: number) {
  const map: Record<string, number> = {
    frequent_visits_from_ip: Math.min(
      riskConfig.frequentVisitsMaxPoints,
      totalScore,
    ),
    hourly_visit_block_threshold: riskConfig.frequentVisitsMaxPoints,
    suspicious_user_agent: riskConfig.suspiciousUserAgentPoints,
    repeated_gclid: riskConfig.repeatedGclidPoints,
    rapid_repeat_request: riskConfig.rapidRequestPoints,
    repeated_visits_without_contact_action: riskConfig.noContactActionPoints,
    trusted_infrastructure_datacenter_signal: riskConfig.datacenterPoints,
    active_ip_block: 100,
  };
  return map[reason] ?? 0;
}

export async function monitorVisit(input: MonitorInput): Promise<MonitorResult> {
  if (!databaseConfigured() || !process.env.IP_HASH_SECRET) {
    return {
      visitId: null,
      decision: 'allow',
      score: 0,
      reasons: ['monitoring_not_configured'],
    };
  }

  const sql = getDb();
  const ipHash = hashIp(input.ip);
  const campaign = extractCampaignData(input.url, input.referrer);
  const gclid = campaign.gclid;
  const now = new Date();
  const verifiedSearchBot = await verifySearchBot(input.ip, input.userAgent);

  return sql.begin(async (tx) => {
    // Serialize scoring for one IP so concurrent requests cannot race past
    // hourly thresholds before their visits are committed.
    await tx`SELECT pg_advisory_xact_lock(hashtext(${ipHash}))`;

    const [snapshot] = await tx<{
      visitsInLastHour: number;
      previousVisits: number;
      repeatedGclidCount: number;
      lastVisitAt: Date | null;
      contactActions: number;
      allowlisted: boolean;
      activeBlockSource: 'manual' | 'automatic' | null;
    }[]>`
      SELECT
        (SELECT count(*)::int FROM visits
          WHERE ip_hash = ${ipHash} AND created_at >= now() - interval '1 hour') AS "visitsInLastHour",
        (SELECT count(*)::int FROM visits WHERE ip_hash = ${ipHash}) AS "previousVisits",
        (SELECT count(*)::int FROM visits
          WHERE ${gclid}::text IS NOT NULL AND gclid = ${gclid}) AS "repeatedGclidCount",
        (SELECT max(created_at) FROM visits WHERE ip_hash = ${ipHash}) AS "lastVisitAt",
        (SELECT count(*)::int FROM risk_events
          WHERE ip_hash = ${ipHash}
            AND event_type IN ('phone_click', 'whatsapp_click')
            AND created_at >= now() - interval '30 days') AS "contactActions",
        EXISTS(SELECT 1 FROM ip_allowlist WHERE ip_hash = ${ipHash} AND active = true) AS allowlisted,
        (SELECT source FROM ip_blocks
          WHERE ip_hash = ${ipHash}
            AND active = true
            AND starts_at <= now()
            AND (indefinite = true OR expires_at > now())
          ORDER BY created_at DESC LIMIT 1) AS "activeBlockSource"
    `;

    const secondsSincePreviousVisit = snapshot.lastVisitAt
      ? Math.max(0, (now.getTime() - new Date(snapshot.lastVisitAt).getTime()) / 1000)
      : null;

    const risk = evaluateRisk({
      visitsInLastHour: snapshot.visitsInLastHour + 1,
      previousVisits: snapshot.previousVisits,
      repeatedGclidCount: gclid ? snapshot.repeatedGclidCount + 1 : 0,
      secondsSincePreviousVisit,
      contactActionsInLast30Days: snapshot.contactActions,
      userAgent: input.userAgent,
      activeBlock: Boolean(snapshot.activeBlockSource),
      allowlisted: snapshot.allowlisted,
      verifiedSearchBot,
      datacenterTraffic: Boolean(input.infrastructureDatacenterSignal),
    });

    const blockStatus = snapshot.allowlisted
      ? 'allowlisted'
      : snapshot.activeBlockSource
        ? snapshot.activeBlockSource === 'automatic'
          ? 'auto_blocked'
          : 'manual_blocked'
        : risk.automaticBlock
          ? 'auto_blocked'
          : 'none';

    const [visit] = await tx<{ id: string }[]>`
      INSERT INTO visits (
        ip, ip_hash, visited_path, landing_page, source, referrer,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content,
        gclid, user_agent, device_type, country, previous_visits,
        risk_score, decision, risk_reasons, block_status
      ) VALUES (
        ${input.ip}::inet,
        ${ipHash},
        ${limited(input.url.pathname, 500)},
        ${campaign.landingPage},
        ${campaign.source},
        ${campaign.referrer},
        ${campaign.utmSource},
        ${campaign.utmMedium},
        ${campaign.utmCampaign},
        ${campaign.utmTerm},
        ${campaign.utmContent},
        ${gclid},
        ${limited(input.userAgent, 700)},
        ${detectDeviceType(input.userAgent)},
        ${input.country},
        ${snapshot.previousVisits},
        ${risk.score},
        ${risk.decision},
        ${risk.reasons},
        ${blockStatus}
      )
      RETURNING id
    `;

    for (const reason of risk.reasons) {
      const points = pointsForReason(reason, risk.score);
      await tx`
        INSERT INTO risk_events (visit_id, ip_hash, event_type, points, details)
        VALUES (${visit.id}::uuid, ${ipHash}, ${reason}, ${points}, ${tx.json({
          decision: risk.decision,
          totalScore: risk.score,
        })})
      `;
    }

    if (risk.automaticBlock) {
      await tx`
        INSERT INTO ip_blocks (
          ip, ip_hash, reason, source, starts_at, expires_at, indefinite, active
        ) VALUES (
          ${input.ip}::inet,
          ${ipHash},
          ${risk.reasons.join(', ')},
          'automatic',
          now(),
          now() + (${riskConfig.automaticBlockMinutes} * interval '1 minute'),
          false,
          true
        )
      `;
    }

    return {
      visitId: visit.id,
      decision: risk.decision,
      score: risk.score,
      reasons: risk.reasons,
    };
  });
}

export async function recordContactAction(
  ip: string,
  visitId: string | null,
  action: 'phone_click' | 'whatsapp_click',
) {
  if (!databaseConfigured() || !process.env.IP_HASH_SECRET) {
    return 'not_configured' as const;
  }
  const sql = getDb();
  const ipHash = hashIp(ip);
  return sql.begin(async (tx) => {
    const [recent] = await tx<{ exists: boolean }[]>`
      SELECT EXISTS(
        SELECT 1 FROM risk_events
        WHERE ip_hash = ${ipHash}
          AND event_type = ${action}
          AND created_at >= now() - interval '30 seconds'
      ) AS exists
    `;
    if (recent.exists) return 'duplicate' as const;
    const [rate] = await tx<{ count: number }[]>`
      SELECT count(*)::int AS count
      FROM risk_events
      WHERE ip_hash = ${ipHash}
        AND event_type IN ('phone_click', 'whatsapp_click')
        AND created_at >= now() - interval '1 minute'
    `;
    if (rate.count >= 10) return 'rate_limited' as const;
    await tx`
      INSERT INTO risk_events (visit_id, ip_hash, event_type, points, details)
      VALUES (${visitId}::uuid, ${ipHash}, ${action}, 0, ${tx.json({ source: 'public_cta' })})
    `;
    if (visitId) {
      await tx`
        UPDATE visits SET contact_action = ${action}, contact_clicked_at = now()
        WHERE id = ${visitId}::uuid AND ip_hash = ${ipHash}
      `;
    }
    return 'recorded' as const;
  });
}
