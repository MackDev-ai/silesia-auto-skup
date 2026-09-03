import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/security/ip', () => ({
  resolveClientIp: () => '192.0.2.50',
  countryFromTrustedHeaders: () => 'PL',
}));

vi.mock('@/lib/security/monitor', () => ({
  monitorVisit: async () => ({
    visitId: '11111111-1111-4111-8111-111111111111',
    decision: 'block',
    score: 100,
    reasons: ['active_ip_block'],
  }),
}));

import { proxy } from '@/proxy';

describe('early blocking proxy', () => {
  it('returns a neutral 403 before rendering the public page', async () => {
    const response = await proxy(
      new NextRequest('https://example.test/', {
        headers: { accept: 'text/html', 'user-agent': 'Mozilla/5.0' },
      }),
    );
    expect(response.status).toBe(403);
    expect(await response.text()).toContain('Dostęp czasowo ograniczony');
    expect(response.headers.get('x-robots-tag')).toContain('noindex');
  });
});
