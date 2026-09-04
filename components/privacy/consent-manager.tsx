'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { Cookie, ShieldCheck, SlidersHorizontal, X } from 'lucide-react';

import {
  COOKIE_CONSENT_MAX_AGE_SECONDS,
  COOKIE_CONSENT_NAME,
  COOKIE_CONSENT_VERSION,
  OPEN_COOKIE_SETTINGS_EVENT,
  readCookieConsent,
  serializeCookieConsent,
  type CookieConsent,
} from '@/lib/privacy-consent';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __sasConsent?: Pick<CookieConsent, 'analytics' | 'marketing'>;
  }
}

type Props = {
  googleAnalyticsId?: string;
  googleAdsId?: string;
};

function writeConsentCookie(consent: CookieConsent) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE_CONSENT_NAME}=${encodeURIComponent(serializeCookieConsent(consent))}; Path=/; Max-Age=${COOKIE_CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

function expireGoogleCookies() {
  const names = document.cookie
    .split(';')
    .map((part) => part.trim().split('=')[0])
    .filter((name) => name === '_ga' || name.startsWith('_ga_'));
  const host = window.location.hostname;
  const rootDomain = host.split('.').slice(-2).join('.');
  for (const name of names) {
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
    document.cookie = `${name}=; Path=/; Domain=${host}; Max-Age=0; SameSite=Lax`;
    if (rootDomain.includes('.')) {
      document.cookie = `${name}=; Path=/; Domain=.${rootDomain}; Max-Age=0; SameSite=Lax`;
    }
  }
}

function GoogleTags({
  consent,
  googleAnalyticsId,
  googleAdsId,
}: Props & { consent: CookieConsent }) {
  const pathname = usePathname();
  const [prepared, setPrepared] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const tagId = consent.analytics
    ? googleAnalyticsId
    : consent.marketing
      ? googleAdsId
      : '';

  useEffect(() => {
    if (!tagId) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function gtag(...args: unknown[]) {
        window.dataLayer?.push(args);
      };
    window.gtag('consent', 'default', {
      analytics_storage: consent.analytics ? 'granted' : 'denied',
      ad_storage: consent.marketing ? 'granted' : 'denied',
      ad_user_data: consent.marketing ? 'granted' : 'denied',
      ad_personalization: consent.marketing ? 'granted' : 'denied',
      wait_for_update: 500,
    });
    const frame = window.requestAnimationFrame(() => setPrepared(true));
    return () => window.cancelAnimationFrame(frame);
  }, [consent.analytics, consent.marketing, tagId]);

  useEffect(() => {
    if (!loaded || !window.gtag || pathname.startsWith('/admin')) return;
    window.gtag('event', 'page_view', {
      page_location: window.location.href,
      page_path: `${window.location.pathname}${window.location.search}`,
      page_title: document.title,
    });
  }, [loaded, pathname]);

  if (!tagId || !prepared || pathname.startsWith('/admin')) return null;

  return (
    <Script
      id="sas-google-tag"
      src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(tagId)}`}
      strategy="afterInteractive"
      onReady={() => {
        if (!window.gtag) return;
        window.gtag('js', new Date());
        if (consent.analytics && googleAnalyticsId) {
          window.gtag('config', googleAnalyticsId, {
            send_page_view: false,
            anonymize_ip: true,
          });
        }
        if (consent.marketing && googleAdsId) {
          window.gtag('config', googleAdsId, { send_page_view: false });
        }
        setLoaded(true);
      }}
    />
  );
}

export function ConsentManager({ googleAnalyticsId, googleAdsId }: Props) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const hasOptionalTools = Boolean(googleAnalyticsId || googleAdsId);
  const isAdmin = pathname.startsWith('/admin');
  const showFirstChoice = ready && !isAdmin && consent === null && !settingsOpen;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = readCookieConsent(document.cookie);
      setConsent(stored);
      setAnalytics(stored?.analytics ?? false);
      setMarketing(stored?.marketing ?? false);
      window.__sasConsent = stored
        ? { analytics: stored.analytics, marketing: stored.marketing }
        : { analytics: false, marketing: false };
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const openSettings = () => {
      setAnalytics(consent?.analytics ?? false);
      setMarketing(consent?.marketing ?? false);
      setSettingsOpen(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, openSettings);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, openSettings);
  }, [consent]);

  const statusText = useMemo(() => {
    if (!hasOptionalTools) {
      return 'Narzędzia opcjonalne nie są jeszcze skonfigurowane.';
    }
    return 'Opcjonalne narzędzia uruchomimy wyłącznie zgodnie z Twoim wyborem.';
  }, [hasOptionalTools]);

  function save(next: CookieConsent) {
    const requiresCleanReload = Boolean(
      consent &&
        (consent.analytics !== next.analytics || consent.marketing !== next.marketing),
    );
    writeConsentCookie(next);
    window.__sasConsent = {
      analytics: next.analytics,
      marketing: next.marketing,
    };
    if (!next.analytics) expireGoogleCookies();
    setConsent(next);
    setSettingsOpen(false);
    if (requiresCleanReload) window.location.reload();
  }

  const necessaryOnly: CookieConsent = {
    version: COOKIE_CONSENT_VERSION,
    analytics: false,
    marketing: false,
  };

  if (isAdmin) return null;

  return (
    <>
      {consent && (consent.analytics || consent.marketing) && (
        <GoogleTags
          consent={consent}
          googleAnalyticsId={googleAnalyticsId}
          googleAdsId={googleAdsId}
        />
      )}

      {showFirstChoice && (
        <section
          aria-label="Ustawienia prywatności"
          className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[80] mx-auto max-w-4xl rounded-[24px] border border-white/15 bg-[#151714] p-5 text-white shadow-[0_24px_90px_rgba(0,0,0,.5)] sm:inset-x-6 sm:p-6"
        >
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex min-w-0 gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-amber-400 text-black">
                <Cookie className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-black tracking-[-0.03em]">Twoja prywatność i cookies</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-white/60">
                  Niezbędne cookies chronią stronę i panel. Google Analytics oraz
                  pomiar reklam włączymy dopiero po Twojej zgodzie. {statusText}{' '}
                  <a className="font-bold text-amber-300 underline" href="/polityka-cookies">
                    Dowiedz się więcej
                  </a>
                  .
                </p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
              <button
                type="button"
                className="h-11 rounded-full bg-amber-400 px-5 text-sm font-black text-black hover:bg-amber-300"
                onClick={() =>
                  save({
                    version: COOKIE_CONSENT_VERSION,
                    analytics: Boolean(googleAnalyticsId),
                    marketing: Boolean(googleAdsId),
                  })
                }
              >
                Akceptuję opcjonalne
              </button>
              <button
                type="button"
                className="h-11 rounded-full border border-white/25 px-5 text-sm font-black text-white hover:bg-white/10"
                onClick={() => save(necessaryOnly)}
              >
                Tylko niezbędne
              </button>
              <button
                type="button"
                className="h-11 rounded-full px-5 text-sm font-bold text-white/70 hover:bg-white/10 hover:text-white"
                onClick={() => setSettingsOpen(true)}
              >
                Ustawienia
              </button>
            </div>
          </div>
        </section>
      )}

      {ready && settingsOpen && (
        <div
          className="fixed inset-0 z-[90] grid place-items-end bg-black/65 p-3 backdrop-blur-sm sm:place-items-center sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && consent) setSettingsOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-settings-title"
            className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[26px] bg-[#f7f7f3] p-5 text-[#111210] shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-[#6b7067]">
                  <SlidersHorizontal className="size-4" /> Ustawienia prywatności
                </span>
                <h2 id="cookie-settings-title" className="mt-3 text-3xl font-black tracking-[-0.05em]">
                  Wybierz zakres zgody
                </h2>
              </div>
              {consent && (
                <button
                  type="button"
                  aria-label="Zamknij ustawienia cookies"
                  className="grid size-10 shrink-0 place-items-center rounded-full border border-black/15 hover:bg-black/5"
                  onClick={() => setSettingsOpen(false)}
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <div className="mt-7 space-y-3">
              <div className="flex gap-4 rounded-2xl border border-black/10 bg-white p-4">
                <ShieldCheck className="mt-0.5 size-5 shrink-0" />
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-black">Niezbędne</h3>
                    <span className="text-xs font-black uppercase text-[#6b7067]">Zawsze aktywne</span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[#62675e]">
                    Zapamiętanie wyboru, ochrona ruchu oraz bezpieczna sesja panelu administratora.
                  </p>
                </div>
              </div>

              <label className="flex cursor-pointer gap-4 rounded-2xl border border-black/10 bg-white p-4">
                <input
                  type="checkbox"
                  className="mt-1 size-5 accent-amber-500"
                  checked={analytics}
                  disabled={!googleAnalyticsId}
                  onChange={(event) => setAnalytics(event.target.checked)}
                />
                <span>
                  <span className="font-black">Analityczne</span>
                  <span className="mt-1 block text-sm leading-6 text-[#62675e]">
                    Google Analytics 4 pomaga poznać zbiorcze statystyki korzystania ze strony.
                    {!googleAnalyticsId && ' Obecnie nieaktywne — brak identyfikatora GA4.'}
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer gap-4 rounded-2xl border border-black/10 bg-white p-4">
                <input
                  type="checkbox"
                  className="mt-1 size-5 accent-amber-500"
                  checked={marketing}
                  disabled={!googleAdsId}
                  onChange={(event) => setMarketing(event.target.checked)}
                />
                <span>
                  <span className="font-black">Marketingowe</span>
                  <span className="mt-1 block text-sm leading-6 text-[#62675e]">
                    Pomiar skuteczności Google Ads, w tym przyszła konwersja kliknięcia w telefon.
                    {!googleAdsId && ' Obecnie nieaktywne — brak identyfikatora Google Ads.'}
                  </span>
                </span>
              </label>
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                className="h-12 rounded-full bg-[#111210] px-5 text-sm font-black text-white hover:bg-[#2b2e28]"
                onClick={() =>
                  save({
                    version: COOKIE_CONSENT_VERSION,
                    analytics: googleAnalyticsId ? analytics : false,
                    marketing: googleAdsId ? marketing : false,
                  })
                }
              >
                Zapisz wybór
              </button>
              <button
                type="button"
                className="h-12 rounded-full border border-black/20 px-5 text-sm font-black hover:bg-black/5"
                onClick={() => save(necessaryOnly)}
              >
                Odrzuć opcjonalne
              </button>
            </div>
            <p className="mt-4 text-xs leading-5 text-[#71766d]">
              Zgodę możesz w każdej chwili zmienić w stopce. Zmiana wyboru przeładuje stronę,
              aby zatrzymać wcześniej uruchomione narzędzia.
            </p>
          </section>
        </div>
      )}
    </>
  );
}
