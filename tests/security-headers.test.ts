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
    expect(contentSecurityPolicy).not.toContain('google-analytics.com');
  });
});
