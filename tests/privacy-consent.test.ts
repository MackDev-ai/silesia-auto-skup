import { describe, expect, it } from 'vitest';

import {
  COOKIE_CONSENT_NAME,
  COOKIE_CONSENT_VERSION,
  parseCookieConsent,
  readCookieConsent,
  serializeCookieConsent,
} from '@/lib/privacy-consent';

describe('privacy consent', () => {
  it('serializes and reads granular consent', () => {
    const value = serializeCookieConsent({
      version: COOKIE_CONSENT_VERSION,
      analytics: true,
      marketing: false,
    });
    expect(value).toBe('v1.a1.m0');
    expect(readCookieConsent(`other=1; ${COOKIE_CONSENT_NAME}=${value}`)).toEqual({
      version: 1,
      analytics: true,
      marketing: false,
    });
  });

  it('rejects malformed and obsolete consent values', () => {
    expect(parseCookieConsent('v2.a1.m1')).toBeNull();
    expect(parseCookieConsent('v1.a2.m0')).toBeNull();
    expect(parseCookieConsent('granted')).toBeNull();
  });
});

