import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it } from 'vitest';

import { POST as manageIp } from '@/app/api/admin/ip-rules/route';
import { proxy } from '@/proxy';
import {
  passwordHashForSetup,
  validMutationOrigin,
  verifyPassword,
} from '@/lib/security/auth';

afterEach(() => {
  delete process.env.SESSION_SECRET;
  delete process.env.ADMIN_EMAIL;
});

describe('administrator authorization', () => {
  it('redirects an unauthenticated user away from the panel', async () => {
    const response = await proxy(new NextRequest('http://localhost/admin'));
    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.headers.get('location')).toContain('/admin/login');
    expect(response.headers.get('x-robots-tag')).toContain('noindex');
  });

  it('does not allow an unauthenticated user to change IP rules', async () => {
    const request = new NextRequest('http://localhost/api/admin/ip-rules', {
      method: 'POST',
      headers: { origin: 'http://localhost', host: 'localhost' },
      body: new URLSearchParams({
        action: 'block_indefinite',
        ip: '192.0.2.1',
      }),
    });
    expect((await manageIp(request)).status).toBe(401);
  });

  it('rejects a cross-site mutation origin', () => {
    const request = new Request('https://silesia.example/api/admin/ip-rules', {
      method: 'POST',
      headers: { origin: 'https://attacker.example' },
    });
    expect(validMutationOrigin(request)).toBe(false);
  });

  it('verifies a Cloudflare-compatible administrator password hash', () => {
    const hash = passwordHashForSetup('correct horse battery staple');

    expect(verifyPassword('correct horse battery staple', hash)).toBe(true);
    expect(verifyPassword('wrong password', hash)).toBe(false);
  });

  it('rejects an unsupported PBKDF2 cost without hashing', () => {
    const unsupportedHash = 'pbkdf2_sha256$210000$c2FsdA$aGFzaA';

    expect(verifyPassword('any password', unsupportedHash)).toBe(false);
  });
});
