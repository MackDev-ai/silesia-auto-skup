import { z } from 'zod';

export type ContactFormEnvironment = {
  RESEND_API_KEY?: unknown;
  CONTACT_FORM_TO?: unknown;
  CONTACT_FORM_FROM?: unknown;
  CONTACT_EMAIL_FETCH?: typeof fetch;
};

const schema = z
  .object({
    name: z.string().trim().max(80).default(''),
    phone: z
      .string()
      .trim()
      .max(24)
      .refine(
        (value) => !value || /^\+?[0-9 ()-]{7,24}$/.test(value),
        'Nieprawidłowy numer telefonu.',
      )
      .default(''),
    email: z
      .string()
      .trim()
      .max(160)
      .refine(
        (value) => !value || z.string().email().safeParse(value).success,
        'Nieprawidłowy adres e-mail.',
      )
      .default(''),
    message: z.string().trim().min(10).max(2000),
    consent: z.boolean(),
    company: z.string().max(200).default(''),
    startedAt: z.coerce.number().int().positive(),
  })
  .refine((value) => Boolean(value.phone || value.email), {
    message: 'Podaj numer telefonu lub adres e-mail.',
    path: ['phone'],
  })
  .refine((value) => value.consent, {
    message: 'Potwierdź zapoznanie się z polityką prywatności.',
    path: ['consent'],
  });

const rateLimit = new Map<string, number[]>();
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_REQUESTS = 5;

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'private, no-store',
    },
  });
}

function safeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      })[character] ?? character,
  );
}

function isRateLimited(key: string, now = Date.now()) {
  const recent = (rateLimit.get(key) ?? []).filter(
    (timestamp) => now - timestamp < RATE_WINDOW_MS,
  );
  if (recent.length >= RATE_MAX_REQUESTS) {
    rateLimit.set(key, recent);
    return true;
  }
  recent.push(now);
  rateLimit.set(key, recent);
  return false;
}

async function requestData(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return request.json().catch(() => null);
  }
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const form = await request.formData();
    return {
      name: form.get('name'),
      phone: form.get('phone'),
      email: form.get('email'),
      message: form.get('message'),
      consent: form.get('consent') === 'on',
      company: form.get('company'),
      startedAt: form.get('startedAt'),
    };
  }
  return null;
}

function wantsJson(request: Request) {
  return request.headers.get('accept')?.includes('application/json') ?? false;
}

function resultResponse(
  request: Request,
  body: { ok: boolean; message: string },
  status: number,
) {
  if (wantsJson(request)) return json(body, status);
  const url = new URL(request.url);
  const target = new URL('/', url.origin);
  target.searchParams.set('contact', body.ok ? 'sent' : 'error');
  target.hash = 'kontakt';
  return Response.redirect(target, 303);
}

export async function handleContactFormRequest(
  request: Request,
  env: ContactFormEnvironment,
) {
  if (request.method !== 'POST') {
    return json({ ok: false, message: 'Metoda niedozwolona.' }, 405);
  }

  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  if (!origin || origin !== url.origin) {
    return json({ ok: false, message: 'Żądanie zostało odrzucone.' }, 403);
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 12_000) {
    return json({ ok: false, message: 'Wiadomość jest zbyt długa.' }, 413);
  }

  const data = await requestData(request);
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return resultResponse(
      request,
      {
        ok: false,
        message:
          parsed.error.issues[0]?.message ?? 'Sprawdź poprawność formularza.',
      },
      400,
    );
  }

  if (parsed.data.company) {
    return resultResponse(
      request,
      { ok: true, message: 'Dziękujemy. Wiadomość została wysłana.' },
      200,
    );
  }

  const elapsed = Date.now() - parsed.data.startedAt;
  if (elapsed < 1_500 || elapsed > 2 * 60 * 60 * 1000) {
    return resultResponse(
      request,
      { ok: false, message: 'Odśwież stronę i spróbuj ponownie.' },
      400,
    );
  }

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  if (isRateLimited(ip)) {
    return resultResponse(
      request,
      { ok: false, message: 'Zbyt wiele prób. Spróbuj ponownie później.' },
      429,
    );
  }

  const to = safeText(env.CONTACT_FORM_TO);
  const from = safeText(env.CONTACT_FORM_FROM);
  const apiKey = safeText(env.RESEND_API_KEY);
  if (!apiKey || !to || !from) {
    console.error('Contact form email service is not configured.');
    return resultResponse(
      request,
      {
        ok: false,
        message:
          'Formularz jest chwilowo niedostępny. Skontaktuj się telefonicznie.',
      },
      503,
    );
  }

  const { name, phone, email, message } = parsed.data;
  const sentAt = new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Warsaw',
  }).format(new Date());
  const contactDetails = [
    `Imię: ${name || 'nie podano'}`,
    `Telefon: ${phone || 'nie podano'}`,
    `E-mail: ${email || 'nie podano'}`,
  ];
  const text = [
    'Nowa wiadomość z formularza na silesiaautoskup.pl',
    '',
    ...contactDetails,
    `Data wysłania: ${sentAt}`,
    '',
    'Wiadomość:',
    message,
  ].join('\n');

  try {
    const subject = `Nowa wiadomość ze strony${name ? ` — ${name}` : ''}`;
    const html = `
        <h2>Nowa wiadomość z formularza</h2>
        <p><strong>Imię:</strong> ${escapeHtml(name || 'nie podano')}</p>
        <p><strong>Telefon:</strong> ${escapeHtml(phone || 'nie podano')}</p>
        <p><strong>E-mail:</strong> ${escapeHtml(email || 'nie podano')}</p>
        <p><strong>Data wysłania:</strong> ${escapeHtml(sentAt)}</p>
        <hr>
        <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
      `;
    const emailFetch = env.CONTACT_EMAIL_FETCH ?? fetch;
    const delivery = await emailFetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
        html,
        ...(email ? { reply_to: email } : {}),
      }),
    });
    if (!delivery.ok) {
      throw new Error(`Resend returned HTTP ${delivery.status}.`);
    }
  } catch (error) {
    console.error('Contact form email delivery failed.', error);
    return resultResponse(
      request,
      {
        ok: false,
        message:
          'Nie udało się wysłać wiadomości. Skontaktuj się telefonicznie.',
      },
      502,
    );
  }

  return resultResponse(
    request,
    { ok: true, message: 'Dziękujemy. Wiadomość została wysłana.' },
    200,
  );
}

export function resetContactFormRateLimitForTests() {
  rateLimit.clear();
}
