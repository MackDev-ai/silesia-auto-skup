import { describe, expect, it } from 'vitest';

import { extractCampaignData } from '@/lib/campaign';
import { resolveClientIp } from '@/lib/security/ip';

describe('campaign capture', () => {
  it('captures all UTM values, gclid, entry path and referrer', () => {
    const url = new URL(
      'https://example.test/?utm_source=google&utm_medium=cpc&utm_campaign=slask&utm_term=skup+aut&utm_content=hero&gclid=abc123',
    );
    expect(extractCampaignData(url, 'https://google.pl/')).toEqual({
      source: 'google',
      referrer: 'https://google.pl/',
      landingPage:
        '/?utm_source=google&utm_medium=cpc&utm_campaign=slask&utm_term=skup+aut&utm_content=hero&gclid=abc123',
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'slask',
      utmTerm: 'skup aut',
      utmContent: 'hero',
      gclid: 'abc123',
    });
  });
});

describe('trusted infrastructure IP adapter', () => {
  it('ignores spoofed X-Forwarded-For in direct mode', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.55' });
    expect(resolveClientIp(headers, 'direct', '198.51.100.22')).toBe('198.51.100.22');
  });

  it('uses only the platform-specific Cloudflare header in Cloudflare mode', () => {
    const headers = new Headers({
      'cf-connecting-ip': '198.51.100.7',
      'x-forwarded-for': '203.0.113.55',
    });
    expect(resolveClientIp(headers, 'cloudflare')).toBe('198.51.100.7');
  });
});
