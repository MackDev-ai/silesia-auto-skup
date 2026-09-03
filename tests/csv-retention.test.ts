import { describe, expect, it } from 'vitest';

import { buildApprovedCsv } from '@/app/api/admin/export/route';
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
        ip: '192.0.2.10', visitCount: 1, campaignCount: 1,
        firstVisit: new Date(), lastVisit: new Date(), gclids: '=IMPORTXML()',
        riskScore: 40, reasons: 'test', reviewStatus: 'approved',
      },
    ]);
    expect(csv).toContain("'=IMPORTXML()");
  });
});

describe('retention', () => {
  it('calculates a 30-day cutoff', () => {
    expect(retentionCutoff(new Date('2026-09-01T00:00:00Z'), 30).toISOString())
      .toBe('2026-08-02T00:00:00.000Z');
  });
});
