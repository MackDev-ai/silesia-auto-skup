import { createHmac, timingSafeEqual } from 'node:crypto';
import { resolve4, resolve6, reverse } from 'node:dns/promises';
import { isIP } from 'node:net';

import { infrastructureConfig, requireEnvironment } from '@/lib/config';

export type InfrastructureProvider =
  | 'cloudflare'
  | 'vercel'
  | 'trusted-proxy'
  | 'direct';

function firstValidIp(value: string | null) {
  if (!value) return null;
  for (const rawPart of value.split(',')) {
    const part = rawPart.trim().replace(/^\[|\]$/g, '').split('%')[0];
    const normalized = part.startsWith('::ffff:') ? part.slice(7) : part;
    if (isIP(normalized)) return normalized;
  }
  return null;
}

export function resolveClientIp(
  headers: Headers,
  provider = infrastructureConfig.provider as InfrastructureProvider,
  connectionIp?: string | null,
) {
  const socketIp = firstValidIp(connectionIp ?? null);

  if (provider === 'cloudflare') {
    return firstValidIp(headers.get('cf-connecting-ip')) ?? socketIp;
  }

  if (provider === 'vercel') {
    return (
      firstValidIp(headers.get('x-vercel-forwarded-for')) ??
      firstValidIp(headers.get('x-real-ip')) ??
      socketIp
    );
  }

  if (provider === 'trusted-proxy') {
    return (
      firstValidIp(headers.get(infrastructureConfig.trustedProxyHeader)) ??
      socketIp
    );
  }

  // X-Forwarded-For is deliberately ignored in direct mode. The app must only
  // trust an address normalized by a configured reverse proxy/platform.
  return socketIp ?? (process.env.NODE_ENV === 'development' ? '127.0.0.1' : null);
}

export function countryFromTrustedHeaders(
  headers: Headers,
  provider = infrastructureConfig.provider as InfrastructureProvider,
) {
  const raw =
    provider === 'cloudflare'
      ? headers.get('cf-ipcountry')
      : provider === 'vercel'
        ? headers.get('x-vercel-ip-country')
        : null;
  return raw && /^[A-Z]{2}$/.test(raw) ? raw : null;
}

export function hashIp(ip: string) {
  const secret = requireEnvironment('IP_HASH_SECRET');
  return createHmac('sha256', secret).update(ip).digest('hex');
}

const verifiedBotCache = new Map<string, { value: boolean; expiresAt: number }>();

export function looksLikeSearchBot(userAgent: string) {
  return /(?:Googlebot|Google-InspectionTool|AdsBot-Google|bingbot)/i.test(
    userAgent,
  );
}

export async function verifySearchBot(ip: string, userAgent: string) {
  if (!infrastructureConfig.verifySearchBots || !looksLikeSearchBot(userAgent)) {
    return false;
  }

  const key = `${ip}|${userAgent.match(/Google|bing/i)?.[0] ?? 'bot'}`;
  const cached = verifiedBotCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  let verified = false;
  try {
    const hostnames = await reverse(ip);
    const allowedSuffixes = /Google/i.test(userAgent)
      ? ['.googlebot.com', '.google.com']
      : ['.search.msn.com'];

    for (const hostname of hostnames) {
      const lower = hostname.toLowerCase();
      if (!allowedSuffixes.some((suffix) => lower.endsWith(suffix))) continue;
      const [ipv4, ipv6] = await Promise.allSettled([
        resolve4(hostname),
        resolve6(hostname),
      ]);
      const forwardAddresses = [
        ...(ipv4.status === 'fulfilled' ? ipv4.value : []),
        ...(ipv6.status === 'fulfilled' ? ipv6.value : []),
      ];
      if (forwardAddresses.some((address) => address === ip)) {
        verified = true;
        break;
      }
    }
  } catch {
    verified = false;
  }

  verifiedBotCache.set(key, {
    value: verified,
    expiresAt: Date.now() + 6 * 60 * 60 * 1000,
  });
  return verified;
}

export function safeTokenEquals(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
