import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_COOKIE, verifyAdminSession } from '@/lib/security/auth';
import {
  countryFromTrustedHeaders,
  resolveClientIp,
} from '@/lib/security/ip';
import { monitorVisit } from '@/lib/security/monitor';

const blockPage = `<!doctype html>
<html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Dostęp czasowo ograniczony</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#111210;color:#fff;font-family:Arial,sans-serif;padding:24px;box-sizing:border-box}.box{max-width:560px;text-align:center}.dot{display:inline-block;width:48px;height:48px;border-radius:50%;background:#fbbf24;margin-bottom:24px}h1{font-size:clamp(32px,7vw,56px);line-height:.95;margin:0;letter-spacing:-.05em;text-transform:uppercase}p{color:#a8aaa4;line-height:1.7;margin-top:20px}</style>
</head><body><main class="box"><span class="dot" aria-hidden="true"></span><h1>Dostęp czasowo ograniczony</h1><p>System bezpieczeństwa ograniczył to połączenie. Spróbuj ponownie później.</p></main></body></html>`;

function noIndex(response: NextResponse) {
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const session = verifyAdminSession(request.cookies.get(ADMIN_COOKIE)?.value);
    if (!session) {
      const loginUrl = new URL('/admin/login', request.url);
      return noIndex(NextResponse.redirect(loginUrl));
    }
    return noIndex(NextResponse.next());
  }

  if (pathname.startsWith('/admin')) return noIndex(NextResponse.next());

  const acceptsHtml = request.headers.get('accept')?.includes('text/html');
  if (request.method !== 'GET' || !acceptsHtml || pathname !== '/') {
    return NextResponse.next();
  }

  const ip = resolveClientIp(request.headers);
  if (!ip) return NextResponse.next();

  try {
    const result = await monitorVisit({
      ip,
      url: request.nextUrl,
      userAgent: request.headers.get('user-agent') ?? '',
      referrer: request.headers.get('referer') ?? '',
      country: countryFromTrustedHeaders(request.headers),
      infrastructureDatacenterSignal: false,
    });

    if (result.decision === 'block') {
      return new NextResponse(blockPage, {
        status: 403,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'private, no-store',
          'x-robots-tag': 'noindex, nofollow, noarchive',
        },
      });
    }

    const response = NextResponse.next();
    if (result.visitId) {
      response.cookies.set('sas_visit_id', result.visitId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60,
        path: '/',
      });
    }
    return response;
  } catch (error) {
    // Fail open: an analytics outage must not take the public site offline.
    console.error('Traffic monitoring failed', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/', '/admin/:path*'],
};
