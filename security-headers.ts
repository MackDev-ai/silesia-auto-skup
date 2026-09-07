export const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'frame-src https://www.googletagmanager.com https://consent.cookiebot.eu https://consent.cookiebot.com https://consentcdn.cookiebot.eu https://consentcdn.cookiebot.com',
  "object-src 'none'",
  "img-src 'self' data: blob: https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://www.googleadservices.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://*.g.doubleclick.net https://www.google.com https://google.com https://www.google.pl https://google.pl https://imgsct.cookiebot.eu https://imgsct.cookiebot.com https://consent.cookiebot.eu https://consent.cookiebot.com https://consentcdn.cookiebot.eu https://consentcdn.cookiebot.com",
  "font-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://consent.cookiebot.eu https://consent.cookiebot.com",
  "script-src-elem 'self' 'unsafe-inline' https://www.googletagmanager.com https://consent.cookiebot.eu https://consent.cookiebot.com",
  "connect-src 'self' https://www.google.com https://google.com https://www.google.pl https://google.pl https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://www.googleadservices.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://*.g.doubleclick.net https://ad.doubleclick.net https://consent.cookiebot.eu https://consent.cookiebot.com https://consentcdn.cookiebot.eu https://consentcdn.cookiebot.com",
  'upgrade-insecure-requests',
].join('; ');

export const applicationSecurityHeaders = {
  'Content-Security-Policy': contentSecurityPolicy,
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
} as const;
