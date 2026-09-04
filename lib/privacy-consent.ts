export const COOKIE_CONSENT_NAME = 'sas_cookie_consent';
export const COOKIE_CONSENT_VERSION = 1 as const;
export const COOKIE_CONSENT_MAX_AGE_SECONDS = 180 * 24 * 60 * 60;
export const OPEN_COOKIE_SETTINGS_EVENT = 'sas:open-cookie-settings';

export type CookieConsent = {
  version: typeof COOKIE_CONSENT_VERSION;
  analytics: boolean;
  marketing: boolean;
};

export function serializeCookieConsent(consent: CookieConsent) {
  return `v${consent.version}.a${Number(consent.analytics)}.m${Number(consent.marketing)}`;
}

export function parseCookieConsent(value?: string | null): CookieConsent | null {
  const match = value?.match(/^v(\d+)\.a([01])\.m([01])$/);
  if (!match || Number(match[1]) !== COOKIE_CONSENT_VERSION) return null;
  return {
    version: COOKIE_CONSENT_VERSION,
    analytics: match[2] === '1',
    marketing: match[3] === '1',
  };
}

export function cookieValue(cookieHeader: string, name: string) {
  const prefix = `${name}=`;
  const pair = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return pair ? decodeURIComponent(pair.slice(prefix.length)) : null;
}

export function readCookieConsent(cookieHeader: string) {
  return parseCookieConsent(cookieValue(cookieHeader, COOKIE_CONSENT_NAME));
}

