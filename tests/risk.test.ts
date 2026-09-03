import { describe, expect, it } from 'vitest';

import { evaluateRisk, type RiskInput } from '@/lib/security/risk';

const normal: RiskInput = {
  visitsInLastHour: 1,
  previousVisits: 0,
  repeatedGclidCount: 0,
  secondsSincePreviousVisit: null,
  contactActionsInLast30Days: 0,
  userAgent: 'Mozilla/5.0 Chrome/124 Safari/537.36',
  activeBlock: false,
  allowlisted: false,
  verifiedSearchBot: false,
  datacenterTraffic: false,
};

describe('risk engine', () => {
  it('allows an ordinary first visit', () => {
    expect(evaluateRisk(normal)).toMatchObject({ score: 0, decision: 'allow' });
  });

  it('raises the score for repeating visits', () => {
    const repeated = evaluateRisk({
      ...normal,
      visitsInLastHour: 8,
      previousVisits: 7,
      contactActionsInLast30Days: 1,
    });
    expect(repeated.score).toBeGreaterThan(0);
    expect(repeated.reasons).toContain('frequent_visits_from_ip');
  });

  it('marks the review threshold as review', () => {
    expect(
      evaluateRisk({
        ...normal,
        visitsInLastHour: 8,
        previousVisits: 7,
        contactActionsInLast30Days: 1,
      }).decision,
    ).toBe('review');
  });

  it('blocks after the configured hourly block threshold', () => {
    expect(
      evaluateRisk({ ...normal, visitsInLastHour: 30, previousVisits: 29 }),
    ).toMatchObject({ decision: 'block', automaticBlock: true });
  });

  it('blocks an actively manually blocked IP', () => {
    expect(evaluateRisk({ ...normal, activeBlock: true }).decision).toBe('block');
  });

  it('never automatically blocks an allowlisted IP', () => {
    expect(
      evaluateRisk({
        ...normal,
        allowlisted: true,
        visitsInLastHour: 100,
        activeBlock: true,
      }),
    ).toMatchObject({ decision: 'allow', automaticBlock: false });
  });

  it('adds independent points for rapid requests, repeated gclid and automation', () => {
    const result = evaluateRisk({
      ...normal,
      visitsInLastHour: 3,
      previousVisits: 2,
      repeatedGclidCount: 3,
      secondsSincePreviousVisit: 1,
      userAgent: 'python-requests/2.32',
    });
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.decision).toBe('block');
  });
});
