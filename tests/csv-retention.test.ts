import { describe, expect, it } from 'vitest';

import { buildApprovedCsv } from '@/app/api/admin/export/route';
import { buildVisitLogsCsv } from '@/app/api/admin/visits-export/route';
import { retentionCutoff } from '@/lib/retention';

describe('approved IP export', () => {
  it('contains only rows supplied by the approved-report repository', () => {
    const csv = buildApprovedCsv([
      {
        ip: '192.0.2.10',
        visitCount: 12,
        campaignCount: 2,
        firstVisit: new Date('2026-01-01T10:00:00Z'),
        lastVisit: new Date('2026-01-02T10:00:00Z'),
        gclids: 'gclid-1',
        riskScore: 62,
        reasons: 'frequent_visits_from_ip',
        reviewStatus: 'approved',
      },
    ]);
    expect(csv).toContain('192.0.2.10');
    expect(csv).toContain('approved');
    expect(csv).not.toContain('unreviewed');
  });

  it('protects spreadsheet programs from formula injection', () => {
    const csv = buildApprovedCsv([
      {
        ip: '192.0.2.10',
        visitCount: 1,
        campaignCount: 1,
        firstVisit: new Date(),
        lastVisit: new Date(),
        gclids: '=IMPORTXML()',
        riskScore: 40,
        reasons: 'test',
        reviewStatus: 'approved',
      },
    ]);
    expect(csv).toContain("'=IMPORTXML()");
  });
});

describe('filtered visit log export', () => {
  it('exports raw visit fields without requiring manual approval', () => {
    const csv = buildVisitLogsCsv([
      {
        createdAt: new Date('2026-09-07T08:15:00Z'),
        ip: '198.51.100.7',
        ipHash: 'a'.repeat(64),
        visitedPath: '/',
        landingPage: 'https://silesiaautoskup.pl/?utm_campaign=test',
        source: 'google',
        referrer: 'https://www.google.pl/',
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'test',
        utmTerm: null,
        utmContent: null,
        gclid: '=unsafe-formula',
        userAgent: 'Mozilla/5.0',
        deviceType: 'mobile',
        country: 'PL',
        previousVisits: 3,
        riskScore: 40,
        decision: 'review',
        riskReasons: ['frequent_visits_from_ip'],
        blockStatus: 'none',
        manualReviewStatus: 'unreviewed',
        contactAction: 'phone_click',
        contactClickedAt: new Date('2026-09-07T08:16:00Z'),
      },
    ]);

    expect(csv).toContain('198.51.100.7');
    expect(csv).toContain('unreviewed');
    expect(csv).toContain('phone_click');
    expect(csv).toContain("'=unsafe-formula");
  });
});

describe('retention', () => {
  it('calculates a 30-day cutoff', () => {
    expect(
      retentionCutoff(new Date('2026-09-01T00:00:00Z'), 30).toISOString(),
    ).toBe('2026-08-02T00:00:00.000Z');
  });
});
