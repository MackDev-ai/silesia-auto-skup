import { describe, expect, it } from 'vitest';

import { evaluateRisk, type RiskInput } from '@/lib/security/risk';

describe('risk engine overhead', () => {
  it('evaluates 10,000 requests without noticeable CPU overhead', () => {
    const input: RiskInput = {
      visitsInLastHour: 3, previousVisits: 2, repeatedGclidCount: 0,
      secondsSincePreviousVisit: 60, contactActionsInLast30Days: 0,
      userAgent: 'Mozilla/5.0 Chrome/124 Safari/537.36', activeBlock: false,
      allowlisted: false, verifiedSearchBot: false, datacenterTraffic: false,
    };
    const started = performance.now();
    for (let index = 0; index < 10_000; index += 1) evaluateRisk(input);
    expect(performance.now() - started).toBeLessThan(250);
  });
});
