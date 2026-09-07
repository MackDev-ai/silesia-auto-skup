import { describe, expect, it } from 'vitest';

import {
  applicationSecurityHeaders,
  contentSecurityPolicy,
} from '@/security-headers';

describe('security headers shared by Next.js and Cloudflare Workers', () => {
  it('prevents framing and restricts scripts by default', () => {
    expect(applicationSecurityHeaders['X-Frame-Options']).toBe('DENY');
    expect(applicationSecurityHeaders['X-Content-Type-Options']).toBe(
      'nosniff',
    );
    expect(contentSecurityPolicy).toContain("default-src 'self'");
    expect(contentSecurityPolicy).toContain("frame-ancestors 'none'");
    expect(contentSecurityPolicy).toContain('https://www.googletagmanager.com');
    expect(contentSecurityPolicy).toContain('https://www.google-analytics.com');
    expect(contentSecurityPolicy).toContain(
      'frame-src https://www.googletagmanager.com',
    );
    expect(contentSecurityPolicy).toContain(
      "script-src-elem 'self' 'unsafe-inline' https://www.googletagmanager.com https://consent.cookiebot.eu",
    );
    expect(contentSecurityPolicy).toContain(
      'https://consentcdn.cookiebot.eu',
    );
    expect(contentSecurityPolicy).toContain('https://imgsct.cookiebot.eu');
    expect(contentSecurityPolicy).toContain(
      'https://pagead2.googlesyndication.com',
    );
    expect(contentSecurityPolicy).toContain('https://*.g.doubleclick.net');
  });
});
