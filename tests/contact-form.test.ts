import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  handleContactFormRequest,
  resetContactFormRateLimitForTests,
  type ContactFormEnvironment,
} from '@/lib/contact-form-handler';

function request(body: object, origin = 'https://silesiaautoskup.pl') {
  return new Request(`${origin}/api/contact`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      origin,
      'cf-connecting-ip': '203.0.113.10',
    },
    body: JSON.stringify({
      name: 'Jan',
      phone: '+48 500 600 700',
      email: 'jan@example.com',
      message: 'Proszę o kontakt w sprawie samochodu.',
      consent: true,
      company: '',
      startedAt: Date.now() - 5_000,
      ...body,
    }),
  });
}

function environment(
  emailFetch = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ id: 'email_1' }), { status: 200 }),
    ),
) {
  return {
    RESEND_API_KEY: 're_test_key',
    CONTACT_FORM_TO: 'silesiaautoskup@gmail.com',
    CONTACT_FORM_FROM: 'Silesia Auto Skup <formularz@mail.silesiaautoskup.pl>',
    CONTACT_EMAIL_FETCH: emailFetch,
  } satisfies ContactFormEnvironment;
}

describe('contact form handler', () => {
  beforeEach(() => resetContactFormRateLimitForTests());

  it('sends a validated message to the fixed company address', async () => {
    const emailFetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ id: 'email_1' }), { status: 200 }),
      );
    const response = await handleContactFormRequest(
      request({}),
      environment(emailFetch),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual(expect.objectContaining({ ok: true }));
    expect(emailFetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    const options = emailFetch.mock.calls[0]?.[1] as RequestInit;
    const sentMessage = JSON.parse(String(options.body));
    expect(sentMessage).toEqual(
      expect.objectContaining({
        from: 'Silesia Auto Skup <formularz@mail.silesiaautoskup.pl>',
        to: ['silesiaautoskup@gmail.com'],
        reply_to: 'jan@example.com',
      }),
    );
    expect(sentMessage.text).toContain('Proszę o kontakt w sprawie samochodu.');
  });

  it('rejects requests from a foreign origin', async () => {
    const send = vi.fn();
    const foreign = request({});
    const altered = new Request(foreign, {
      headers: {
        ...Object.fromEntries(foreign.headers),
        origin: 'https://attacker.example',
      },
    });
    const response = await handleContactFormRequest(altered, environment(send));

    expect(response.status).toBe(403);
    expect(send).not.toHaveBeenCalled();
  });

  it('requires a phone number or e-mail and consent', async () => {
    const send = vi.fn();
    const response = await handleContactFormRequest(
      request({ phone: '', email: '', consent: false }),
      environment(send),
    );

    expect(response.status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it('silently accepts the honeypot without sending e-mail', async () => {
    const send = vi.fn();
    const response = await handleContactFormRequest(
      request({ company: 'spam bot ltd' }),
      environment(send),
    );

    expect(response.status).toBe(200);
    expect(send).not.toHaveBeenCalled();
  });
});
