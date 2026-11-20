'use client';

import { FormEvent, useState } from 'react';
import { AlertCircle, CheckCircle2, LoaderCircle, Send } from 'lucide-react';

type FormStatus =
  | { state: 'idle'; message: '' }
  | { state: 'sending'; message: string }
  | { state: 'success'; message: string }
  | { state: 'error'; message: string };

const initialStatus: FormStatus = { state: 'idle', message: '' };

// Records a successful form submission the same way phone/WhatsApp clicks are
// recorded: server-side in the visit log (independent of cookie consent) and as
// a dataLayer event that a Google Tag Manager tag can pick up.
function recordFormSubmit() {
  void fetch('/api/events/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'form_submit' }),
    keepalive: true,
  }).catch(() => undefined);

  const w = window as Window & { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({
    event: 'form_submit',
    contact_method: 'form',
    page_location: window.location.href,
    page_path: `${window.location.pathname}${window.location.search}`,
  });
}

export function ContactForm() {
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [status, setStatus] = useState<FormStatus>(initialStatus);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const phone = String(data.get('phone') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();

    if (!phone && !email) {
      setStatus({
        state: 'error',
        message: 'Podaj numer telefonu lub adres e-mail.',
      });
      return;
    }

    setStatus({ state: 'sending', message: 'Wysyłamy wiadomość…' });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          name: data.get('name'),
          phone,
          email,
          message: data.get('message'),
          consent: data.get('consent') === 'on',
          company: data.get('company'),
          startedAt: Number(data.get('startedAt')),
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
      } | null;

      if (!response.ok || !result?.ok) {
        throw new Error(
          result?.message ||
            'Nie udało się wysłać wiadomości. Spróbuj ponownie.',
        );
      }

      recordFormSubmit();
      form.reset();
      setStartedAt(Date.now());
      setStatus({
        state: 'success',
        message: 'Dziękujemy. Wiadomość została wysłana.',
      });
    } catch (error) {
      setStatus({
        state: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Nie udało się wysłać wiadomości. Spróbuj ponownie.',
      });
    }
  }

  const fieldClass =
    'mt-2 h-12 w-full rounded-xl border border-white/15 bg-white/[0.07] px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20';

  return (
    <form
      action="/api/contact"
      method="post"
      onSubmit={handleSubmit}
      className="rounded-[22px] bg-[#111210] p-5 text-white sm:rounded-[24px] sm:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-400">
            Formularz kontaktowy
          </p>
          <h3 className="mt-2 text-2xl font-black tracking-[-0.04em]">
            Napisz do nas
          </h3>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-amber-400 text-black">
          <Send className="size-5" />
        </span>
      </div>

      <input type="hidden" name="startedAt" value={startedAt} />
      <div
        className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden"
        aria-hidden="true"
      >
        <label htmlFor="contact-company">Firma</label>
        <input
          id="contact-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-bold">
          Imię <span className="font-normal text-white/40">(opcjonalnie)</span>
          <input
            className={fieldClass}
            name="name"
            type="text"
            autoComplete="name"
            maxLength={80}
            placeholder="Jak mamy się zwracać?"
          />
        </label>
        <label className="text-sm font-bold">
          Telefon
          <input
            className={fieldClass}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={24}
            placeholder="Twój numer telefonu"
          />
        </label>
      </div>

      <label className="mt-5 block text-sm font-bold">
        E-mail <span className="font-normal text-white/40">(opcjonalnie)</span>
        <input
          className={fieldClass}
          name="email"
          type="email"
          autoComplete="email"
          maxLength={160}
          placeholder="adres@email.pl"
        />
      </label>

      <label className="mt-5 block text-sm font-bold">
        Wiadomość
        <textarea
          className="mt-2 min-h-32 w-full resize-y rounded-xl border border-white/15 bg-white/[0.07] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/30 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
          name="message"
          required
          minLength={10}
          maxLength={2000}
          placeholder="Napisz, w jakiej sprawie mamy się skontaktować."
        />
      </label>

      <label className="mt-5 flex cursor-pointer items-start gap-3 text-xs leading-5 text-white/55">
        <input
          name="consent"
          type="checkbox"
          required
          className="mt-0.5 size-4 shrink-0 accent-amber-400"
        />
        <span>
          Proszę o kontakt w sprawie przesłanej wiadomości i potwierdzam
          zapoznanie się z{' '}
          <a
            href="/polityka-prywatnosci"
            className="font-bold text-white underline decoration-amber-400 underline-offset-2"
          >
            polityką prywatności
          </a>
          .
        </span>
      </label>

      <button
        type="submit"
        disabled={status.state === 'sending'}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-amber-400 px-6 text-sm font-black text-black transition hover:bg-amber-300 disabled:cursor-wait disabled:opacity-70"
      >
        {status.state === 'sending' ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
        {status.state === 'sending' ? 'Wysyłanie…' : 'Wyślij wiadomość'}
      </button>

      <div className="mt-4 min-h-6" aria-live="polite" role="status">
        {status.state === 'success' && (
          <p className="flex items-center gap-2 text-sm font-bold text-emerald-400">
            <CheckCircle2 className="size-4" /> {status.message}
          </p>
        )}
        {status.state === 'error' && (
          <p className="flex items-center gap-2 text-sm font-bold text-red-300">
            <AlertCircle className="size-4" /> {status.message}
          </p>
        )}
      </div>
    </form>
  );
}
