import { riskConfig } from '@/lib/config';
import { looksLikeSearchBot } from '@/lib/security/ip';

export type RiskDecision = 'allow' | 'review' | 'block';

export type RiskInput = {
  visitsInLastHour: number;
  previousVisits: number;
  repeatedGclidCount: number;
  secondsSincePreviousVisit: number | null;
  contactActionsInLast30Days: number;
  userAgent: string;
  activeBlock: boolean;
  allowlisted: boolean;
  verifiedSearchBot: boolean;
  datacenterTraffic: boolean;
};

export type RiskResult = {
  score: number;
  decision: RiskDecision;
  reasons: string[];
  automaticBlock: boolean;
};

const suspiciousAgentPattern =
  /(?:headless|phantom|selenium|playwright|puppeteer|scrapy|python-requests|aiohttp|httpclient|wget|curl\/|go-http-client|libwww-perl)/i;

export function detectDeviceType(userAgent: string) {
  if (!userAgent) return 'unknown';
  if (/(?:bot|crawler|spider|headless)/i.test(userAgent)) return 'bot';
  if (/(?:ipad|tablet|kindle)/i.test(userAgent)) return 'tablet';
  if (/(?:mobile|iphone|android)/i.test(userAgent)) return 'mobile';
  return 'desktop';
}

export function isSuspiciousUserAgent(userAgent: string) {
  if (!userAgent || userAgent.length < 8) return true;
  // A declared search crawler is never trusted solely by its name, but the name
  // itself also is not grounds for blocking. DNS verification happens separately.
  if (looksLikeSearchBot(userAgent)) return false;
  return suspiciousAgentPattern.test(userAgent);
}

export function evaluateRisk(input: RiskInput): RiskResult {
  if (input.allowlisted) {
    return {
      score: 0,
      decision: 'allow',
      reasons: ['ip_allowlist'],
      automaticBlock: false,
    };
  }

  if (input.verifiedSearchBot) {
    return {
      score: 0,
      decision: 'allow',
      reasons: ['verified_search_bot'],
      automaticBlock: false,
    };
  }

  let score = 0;
  const reasons: string[] = [];

  if (input.activeBlock) {
    score += 100;
    reasons.push('active_ip_block');
  }

  if (input.visitsInLastHour >= riskConfig.blockVisitsPerHour) {
    score += riskConfig.frequentVisitsMaxPoints;
    reasons.push('hourly_visit_block_threshold');
  } else if (input.visitsInLastHour >= riskConfig.reviewVisitsPerHour) {
    const range = Math.max(
      1,
      riskConfig.blockVisitsPerHour - riskConfig.reviewVisitsPerHour,
    );
    const progress =
      (input.visitsInLastHour - riskConfig.reviewVisitsPerHour) / range;
    const points = Math.min(
      riskConfig.frequentVisitsMaxPoints,
      Math.round(40 + progress * 20),
    );
    score += points;
    reasons.push('frequent_visits_from_ip');
  }

  if (isSuspiciousUserAgent(input.userAgent)) {
    score += riskConfig.suspiciousUserAgentPoints;
    reasons.push('suspicious_user_agent');
  }

  if (input.repeatedGclidCount >= riskConfig.repeatedGclidThreshold) {
    score += riskConfig.repeatedGclidPoints;
    reasons.push('repeated_gclid');
  }

  if (
    input.secondsSincePreviousVisit !== null &&
    input.secondsSincePreviousVisit <= riskConfig.rapidRequestWindowSeconds
  ) {
    score += riskConfig.rapidRequestPoints;
    reasons.push('rapid_repeat_request');
  }

  if (
    input.previousVisits >= riskConfig.noContactVisitsThreshold &&
    input.contactActionsInLast30Days === 0
  ) {
    score += riskConfig.noContactActionPoints;
    reasons.push('repeated_visits_without_contact_action');
  }

  if (input.datacenterTraffic) {
    score += riskConfig.datacenterPoints;
    reasons.push('trusted_infrastructure_datacenter_signal');
  }

  const forcedBlock =
    input.activeBlock ||
    input.visitsInLastHour >= riskConfig.blockVisitsPerHour;

  const decision: RiskDecision = forcedBlock
    ? 'block'
    : score <= riskConfig.allowMaxScore
      ? 'allow'
      : score <= riskConfig.reviewMaxScore
        ? 'review'
        : 'block';

  return {
    score,
    decision,
    reasons: reasons.length ? reasons : ['normal_traffic'],
    automaticBlock: decision === 'block' && !input.activeBlock,
  };
}
