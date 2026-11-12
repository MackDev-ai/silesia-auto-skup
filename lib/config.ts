const envText = (name: string) => process.env[name]?.trim() ?? '';

const envInt = (name: string, fallback: number) => {
  const value = Number.parseInt(envText(name), 10);
  return Number.isFinite(value) ? value : fallback;
};

const envBool = (name: string, fallback = false) => {
  const value = envText(name).toLowerCase();
  if (!value) return fallback;
  return value === 'true' || value === '1' || value === 'yes';
};

const cleanPhone = (value: string) => {
  const normalized = value.replace(/[\s()-]/g, '');
  return /^\+[1-9]\d{7,14}$/.test(normalized) ? normalized : '';
};

const displayPhone = (value: string) => {
  const polishNumber = value.match(/^\+48(\d{3})(\d{3})(\d{3})$/);
  return polishNumber
    ? `+48 ${polishNumber[1]} ${polishNumber[2]} ${polishNumber[3]}`
    : value;
};

const cleanSiteUrl = (value: string) => {
  if (!value) return '';
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    return url.origin;
  } catch {
    return '';
  }
};

const cleanGoogleTagManagerId = (value: string) =>
  /^GTM-[A-Z0-9]+$/i.test(value) ? value.toUpperCase() : '';

const cleanGoogleBusinessUrl = (value: string) => {
  if (!value) return '';
  try {
    const url = new URL(value);
    const allowedHosts = new Set([
      'google.com',
      'www.google.com',
      'maps.google.com',
      'maps.app.goo.gl',
      'goo.gl',
    ]);
    return url.protocol === 'https:' && allowedHosts.has(url.hostname)
      ? url.toString()
      : '';
  } catch {
    return '';
  }
};

const configuredPhone = cleanPhone(envText('CONTACT_PHONE'));
const configuredWhatsApp = cleanPhone(envText('WHATSAPP_NUMBER'));
const configuredSiteUrl = cleanSiteUrl(envText('SITE_URL'));
const configuredName = envText('COMPANY_NAME') || 'Silesia Auto Skup';
const configuredAddress = envText('COMPANY_ADDRESS');
const configuredGoogleBusinessUrl = cleanGoogleBusinessUrl(
  envText('GOOGLE_BUSINESS_URL'),
);

export const siteConfig = Object.freeze({
  name: configuredName,
  legalName: envText('COMPANY_LEGAL_NAME'),
  phone: configuredPhone,
  phoneDisplay: displayPhone(configuredPhone),
  phoneHref: configuredPhone ? `tel:${configuredPhone}` : '',
  email: envText('CONTACT_EMAIL'),
  siteUrl: configuredSiteUrl,
  nip: envText('COMPANY_NIP'),
  address: configuredAddress,
  whatsAppNumber: configuredWhatsApp,
  whatsAppHref: configuredWhatsApp
    ? `https://wa.me/${configuredWhatsApp.replace('+', '')}`
    : '',
  googleTagManagerId: cleanGoogleTagManagerId(
    envText('GOOGLE_TAG_MANAGER_ID'),
  ),
  googleBusinessUrl:
    configuredGoogleBusinessUrl ||
    (configuredAddress
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${configuredName}, ${configuredAddress}`,
        )}`
      : ''),
  contactReady: Boolean(configuredPhone),
});

export const riskConfig = Object.freeze({
  reviewVisitsPerHour: envInt('RISK_REVIEW_VISITS_PER_HOUR', 8),
  blockVisitsPerHour: envInt('RISK_BLOCK_VISITS_PER_HOUR', 30),
  allowMaxScore: envInt('RISK_ALLOW_MAX_SCORE', 39),
  reviewMaxScore: envInt('RISK_REVIEW_MAX_SCORE', 79),
  frequentVisitsMaxPoints: envInt('RISK_FREQUENT_VISITS_MAX_POINTS', 60),
  suspiciousUserAgentPoints: envInt('RISK_SUSPICIOUS_UA_POINTS', 30),
  repeatedGclidPoints: envInt('RISK_REPEATED_GCLID_POINTS', 30),
  rapidRequestPoints: envInt('RISK_RAPID_REQUEST_POINTS', 20),
  noContactActionPoints: envInt('RISK_NO_CONTACT_POINTS', 10),
  datacenterPoints: envInt('RISK_DATACENTER_POINTS', 20),
  rapidRequestWindowSeconds: envInt('RISK_RAPID_WINDOW_SECONDS', 5),
  repeatedGclidThreshold: envInt('RISK_REPEATED_GCLID_THRESHOLD', 3),
  noContactVisitsThreshold: envInt('RISK_NO_CONTACT_VISITS_THRESHOLD', 5),
  automaticBlockMinutes: envInt('RISK_AUTO_BLOCK_MINUTES', 60),
  retentionDays: envInt('DATA_RETENTION_DAYS', 30),
});

export const infrastructureConfig = Object.freeze({
  provider: envText('INFRA_PROVIDER') || 'direct',
  trustedProxyHeader: envText('TRUSTED_PROXY_IP_HEADER') || 'x-real-ip',
  databaseSsl: envBool('DATABASE_SSL', true),
  verifySearchBots: envBool('VERIFY_SEARCH_BOTS_DNS', true),
});

export function requireEnvironment(name: string) {
  const value = envText(name);
  if (!value) throw new Error(`Brak wymaganej zmiennej środowiskowej: ${name}`);
  return value;
}

export function getCanonicalUrl(path = '/') {
  if (!siteConfig.siteUrl) return undefined;
  return new URL(path, `${siteConfig.siteUrl}/`).toString();
}
