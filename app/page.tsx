import Image from 'next/image';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  CarFront,
  Check,
  CircleDot,
  Clock3,
  FileCheck2,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Truck,
  Wrench,
} from 'lucide-react';

import { ContactLink } from '@/components/site/contact-link';
import { MobileContactBar } from '@/components/site/mobile-contact-bar';
import { CookieSettingsButton } from '@/components/privacy/cookie-settings-button';
import { siteConfig } from '@/lib/config';

const areas = [
  'Katowice',
  'Gliwice',
  'Zabrze',
  'Bytom',
  'Ruda Śląska',
  'Chorzów',
  'Tychy',
  'Sosnowiec',
];

const faqs = [
  {
    question: 'Jakie samochody rozpatrujecie do zakupu?',
    answer:
      'Indywidualnie wyceniamy samochody osobowe i dostawcze: sprawne, uszkodzone, powypadkowe, z dużym przebiegiem oraz bez ważnego przeglądu lub OC. Ostateczna decyzja zależy od stanu i dokumentów pojazdu.',
  },
  {
    question: 'Czy dojeżdżacie do klienta?',
    answer:
      'Zakładamy możliwość oględzin i odbioru auta na terenie Śląska. Termin oraz dojazd do konkretnej miejscowości zawsze potwierdzamy indywidualnie podczas rozmowy.',
  },
  {
    question: 'Czy muszę przygotować auto do sprzedaży?',
    answer:
      'Nie wymagamy profesjonalnego przygotowania samochodu. Warto jedynie zebrać dokumenty pojazdu i rzetelnie opisać jego aktualny stan podczas pierwszego kontaktu.',
  },
  {
    question: 'Jak wygląda rozliczenie i odbiór pojazdu?',
    answer:
      'Szczegóły rozliczenia, umowy i odbioru ustalamy przed finalizacją. Do transakcji dochodzi dopiero po zaakceptowaniu warunków przez obie strony.',
  },
  {
    question: 'Czy każde zgłoszone auto zostanie kupione?',
    answer:
      'Nie składamy takiej obietnicy. Każdy pojazd wyceniamy indywidualnie, a decyzja o zakupie zależy między innymi od stanu technicznego, prawnego i kompletności dokumentów.',
  },
];

function contactHref() {
  return siteConfig.phoneHref || '#kontakt';
}

function structuredData() {
  const business: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    name: siteConfig.name,
    description:
      'Skup samochodów osobowych i dostawczych na terenie województwa śląskiego.',
    areaServed: areas.map((name) => ({ '@type': 'City', name })),
    knowsAbout: [
      'skup aut Śląsk',
      'skup samochodów uszkodzonych',
      'skup aut powypadkowych',
    ],
  };
  if (siteConfig.siteUrl) business.url = siteConfig.siteUrl;
  if (siteConfig.legalName) business.legalName = siteConfig.legalName;
  if (siteConfig.phone) business.telephone = siteConfig.phone;
  if (siteConfig.email) business.email = siteConfig.email;
  if (siteConfig.address) business.address = siteConfig.address;
  if (siteConfig.nip) business.taxID = siteConfig.nip;

  return [
    business,
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
  ];
}

export default function Home() {
  const primaryHref = contactHref();
  const phoneEnabled = Boolean(siteConfig.phoneHref);

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData()).replace(/</g, '\\u003c'),
        }}
      />

      <div className="border-b border-white/10 bg-[#0b0c0b] text-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-3 text-xs font-medium sm:px-8 lg:px-12">
          <p className="flex items-center gap-2 text-white/60">
            <MapPin className="size-3.5 text-amber-400" /> Skup samochodów na Śląsku
          </p>
          <p className="hidden text-white/60 sm:block">Wycena każdego auta jest indywidualna</p>
        </div>
      </div>

      <header className="absolute inset-x-0 top-[41px] z-20 text-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
          <a href="#start" className="flex items-center gap-3" aria-label={`${siteConfig.name} — strona główna`}>
            <span className="grid size-10 place-items-center rounded-full bg-amber-400 text-[13px] font-black tracking-tighter text-black">SAS</span>
            <span className="max-w-32 text-[15px] font-extrabold uppercase leading-[0.95] tracking-[-0.03em] text-amber-400">{siteConfig.name}</span>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-semibold lg:flex" aria-label="Główna nawigacja">
            <a className="text-white/70 transition hover:text-white" href="#korzysci">Korzyści</a>
            <a className="text-white/70 transition hover:text-white" href="#jak-dzialamy">Jak działamy</a>
            <a className="text-white/70 transition hover:text-white" href="#pojazdy">Pojazdy</a>
            <a className="text-white/70 transition hover:text-white" href="#zasieg">Obszar działania</a>
            <a className="text-white/70 transition hover:text-white" href="#faq">FAQ</a>
          </nav>
          <ContactLink
            href={primaryHref}
            kind={phoneEnabled ? 'phone_click' : undefined}
            googleAdsId={siteConfig.googleAdsId}
            googleAdsLabel={siteConfig.googleAdsPhoneConversionLabel}
            className="inline-flex size-10 shrink-0 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 text-sm font-bold backdrop-blur-md transition hover:bg-white hover:text-black sm:h-10 sm:w-auto sm:px-4"
            ariaLabel="Skontaktuj się"
          >
            <span className="hidden sm:inline">Skontaktuj się</span><ArrowUpRight className="size-4" />
          </ContactLink>
        </div>
      </header>

      <section id="start" className="relative isolate min-h-[790px] bg-[#0b0c0b] text-white">
        <Image
          src="/images/hero-silesia-auto-skup.png"
          alt="Ciemny samochód na tle industrialnej zabudowy kojarzącej się ze Śląskiem"
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[66%_center]"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#090a09_0%,rgba(9,10,9,.93)_42%,rgba(9,10,9,.35)_75%,rgba(9,10,9,.5)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-52 bg-gradient-to-t from-[#0b0c0b] to-transparent" />

        <div className="mx-auto flex min-h-[790px] max-w-[1440px] items-center px-5 pb-20 pt-40 sm:px-8 lg:px-12 lg:pt-32">
          <div className="min-w-0 max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">
              <span className="size-1.5 rounded-full bg-amber-400 shadow-[0_0_12px_#fbbf24]" /> Skup aut Śląsk
            </div>
            <h1 className="hero-title max-w-4xl font-black uppercase">
              <span className="whitespace-nowrap">Sprzedaj auto</span><br />
              <span className="text-amber-400">szybko.</span> Bez<br />zbędnych formalności.
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
              Skupujemy samochody sprawne, uszkodzone i powypadkowe na terenie całego Śląska. Zapewniamy indywidualną wycenę, możliwość odbioru pojazdu i minimum formalności.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ContactLink
                href={primaryHref}
                kind={phoneEnabled ? 'phone_click' : undefined}
                googleAdsId={siteConfig.googleAdsId}
                googleAdsLabel={siteConfig.googleAdsPhoneConversionLabel}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-amber-400 px-5 text-[13px] font-black text-black transition hover:bg-amber-300 sm:px-7 sm:text-sm"
              >
                Porozmawiajmy o Twoim aucie <ArrowRight className="size-4" />
              </ContactLink>
              <a href="#jak-dzialamy" className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-white/20 px-7 text-sm font-bold text-white transition hover:bg-white/10">
                Jak wygląda sprzedaż? <ArrowDown className="size-4" />
              </a>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-white/75">
              {['Indywidualna wycena', 'Możliwość odbioru auta', 'Przejrzyste warunki'].map((item) => (
                <span key={item} className="flex items-center gap-2"><Check className="size-4 text-amber-400" />{item}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="korzysci" className="scroll-mt-10 bg-[#f7f7f3] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1340px]">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="eyebrow">Sprzedaż bez komplikacji</p>
              <h2 className="section-title mt-4">Mniej czasu.<br />Mniej formalności.</h2>
            </div>
            <p className="max-w-xl text-lg leading-8 text-[#666b61] lg:justify-self-end">
              Zamiast samodzielnego przygotowywania ogłoszenia i wielu spotkań z kupującymi, możesz omówić sprzedaż bezpośrednio z lokalną firmą.
            </p>
          </div>
          <div className="mt-16 grid gap-4 md:grid-cols-3">
            {[
              { icon: Clock3, title: 'Sprawny kontakt', copy: 'Podczas rozmowy opisujesz auto i uzgadniasz dalsze kroki bez wysyłania formularza.' },
              { icon: ShieldCheck, title: 'Jasne warunki', copy: 'Przed finalizacją znasz ustalenia dotyczące wyceny, dokumentów, rozliczenia i odbioru.' },
              { icon: Truck, title: 'Możliwość odbioru', copy: 'Oględziny oraz dojazd do wskazanej miejscowości potwierdzamy indywidualnie.' },
            ].map(({ icon: Icon, title, copy }) => (
              <article key={title} className="rounded-[24px] border border-[#dcdfd6] bg-white p-8 sm:p-9">
                <span className="grid size-12 place-items-center rounded-full bg-amber-400 text-black"><Icon className="size-5" /></span>
                <h3 className="mt-14 text-2xl font-black tracking-[-0.04em]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#686d63]">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="jak-dzialamy" className="scroll-mt-10 bg-[#111210] px-5 py-24 text-white sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1340px]">
          <p className="eyebrow text-amber-400">Proces sprzedaży</p>
          <h2 className="section-title mt-4 max-w-4xl text-white">Trzy kroki do<br />sprzedaży auta.</h2>
          <div className="mt-16 grid gap-px overflow-hidden rounded-[28px] bg-white/10 lg:grid-cols-3">
            {[
              { n: '01', icon: Phone, title: 'Kontaktujesz się z nami', copy: 'Telefonicznie opisujesz samochód, jego aktualny stan oraz najważniejsze informacje.' },
              { n: '02', icon: CircleDot, title: 'Ustalamy wycenę', copy: 'Poznajemy szczegóły pojazdu i umawiamy oględziny w dogodnym, wspólnie potwierdzonym miejscu.' },
              { n: '03', icon: Banknote, title: 'Finalizujemy sprzedaż', copy: 'Podpisujemy umowę, rozliczamy transakcję i ustalamy sposób odbioru samochodu.' },
            ].map(({ n, icon: Icon, title, copy }) => (
              <article key={n} className="min-h-[360px] bg-[#171916] p-8 sm:p-10">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-white/35">KROK {n}</span>
                  <Icon className="size-6 text-amber-400" />
                </div>
                <h3 className="mt-24 max-w-xs text-2xl font-black tracking-[-0.04em]">{title}</h3>
                <p className="mt-4 max-w-sm text-sm leading-6 text-white/50">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pojazdy" className="scroll-mt-10 bg-amber-400 px-5 py-24 text-black sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-[1340px] gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/55">Kupowane pojazdy</p>
            <h2 className="section-title mt-4">Każdy stan<br />oceniamy osobno.</h2>
            <p className="mt-6 max-w-lg text-base font-medium leading-7 text-black/60">
              Rozpatrujemy zakup różnych pojazdów, ale nie obiecujemy automatycznego przyjęcia każdego zgłoszenia. Ostateczna wycena zależy od konkretnego auta.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              [CarFront, 'Samochody osobowe'],
              [Truck, 'Samochody dostawcze'],
              [Check, 'Pojazdy sprawne'],
              [Wrench, 'Samochody uszkodzone'],
              [ShieldCheck, 'Auta powypadkowe'],
              [Clock3, 'Auta z dużym przebiegiem'],
              [FileCheck2, 'Bez ważnego przeglądu lub OC'],
            ].map(([Icon, label]) => {
              const VehicleIcon = Icon as typeof CarFront;
              return (
                <div key={label as string} className="flex min-h-28 items-center gap-4 rounded-2xl border border-black/15 bg-black/[0.06] p-5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-black text-amber-400"><VehicleIcon className="size-5" /></span>
                  <h3 className="font-extrabold">{label as string}</h3>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="zasieg" className="scroll-mt-10 bg-[#eceee8] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1340px]">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="eyebrow">Lokalnie na Śląsku</p>
              <h2 className="section-title mt-4">Działamy<br />w całym regionie.</h2>
              <p className="mt-6 max-w-lg text-base leading-7 text-[#656a60]">
                Obsługujemy między innymi Katowice, Gliwice, Zabrze, Bytom, Rudę Śląską, Chorzów, Tychy i Sosnowiec. Możliwość dojazdu do innych miejscowości potwierdzamy indywidualnie.
              </p>
              <a href="#kontakt" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#111210] px-6 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#2b2e28]">
                Przejdź do kontaktu <ArrowRight className="size-4" />
              </a>
            </div>
            <div className="relative overflow-hidden rounded-[28px] border border-[#d0d4c9] bg-[#e2e5dc] p-6 sm:p-9">
              <div className="absolute -right-20 -top-24 size-72 rounded-full border-[54px] border-amber-400/70" />
              <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-3">
                {areas.map((city, index) => (
                  <div key={city} className={`flex min-h-24 items-end rounded-2xl border p-4 ${index === 0 ? 'border-[#111210] bg-[#111210] text-white' : 'border-[#c8cdc0] bg-[#f8f9f5]'}`}>
                    <span className="flex items-center gap-2 text-sm font-bold"><MapPin className={`size-4 ${index === 0 ? 'text-amber-400' : 'text-[#777d70]'}`} />{city}</span>
                  </div>
                ))}
                <div className="flex min-h-24 items-center justify-center rounded-2xl border border-dashed border-[#aeb4a5] p-4 text-center text-sm font-bold text-[#656a60]">Inne miejscowości po potwierdzeniu</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-10 bg-[#f8f9f5] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-[1120px] gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="eyebrow">Najczęstsze pytania</p>
            <h2 className="section-title mt-4">Krótko<br />i konkretnie.</h2>
          </div>
          <div className="border-t border-[#d8dcd1]">
            {faqs.map((item, index) => (
              <details key={item.question} className="group border-b border-[#d8dcd1]" open={index === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-6 text-base font-extrabold sm:text-lg">
                  {item.question}
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[#cdd1c6] text-lg transition group-open:rotate-45">+</span>
                </summary>
                <p className="max-w-2xl pb-6 pr-10 text-sm leading-7 text-[#696e64]">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="kontakt" className="scroll-mt-10 bg-[#111210] px-5 py-20 text-white sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto grid min-w-0 max-w-[1180px] gap-8 overflow-hidden rounded-[28px] bg-amber-400 p-5 text-black sm:gap-10 sm:rounded-[32px] sm:p-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:p-14">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-black/15 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.15em]"><MessageCircle className="size-3.5" /> Kontakt</span>
            <h2 className="contact-title mt-6 font-black uppercase">Porozmawiajmy<br />o Twoim aucie.</h2>
            <p className="mt-5 max-w-lg text-base font-medium leading-7 text-black/60">
              Nie zbieramy danych przez formularze. Docelowo kontakt będzie odbywał się telefonicznie lub przez WhatsApp.
            </p>
          </div>
          <div className="min-w-0 rounded-[22px] bg-[#111210] p-5 text-white sm:rounded-[24px] sm:p-9">
            {phoneEnabled ? (
              <>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/40">Zadzwoń</p>
                <ContactLink
                  href={siteConfig.phoneHref}
                  kind="phone_click"
                  googleAdsId={siteConfig.googleAdsId}
                  googleAdsLabel={siteConfig.googleAdsPhoneConversionLabel}
                  className="mt-4 flex items-center justify-between gap-3 text-2xl font-black tracking-[-0.04em] text-amber-400"
                >
                  {siteConfig.phoneDisplay} <Phone className="size-6" />
                </ContactLink>
                {siteConfig.whatsAppHref && (
                  <ContactLink href={siteConfig.whatsAppHref} kind="whatsapp_click" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-white/70 hover:text-white">
                    WhatsApp <ArrowUpRight className="size-4" />
                  </ContactLink>
                )}
              </>
            ) : (
              <div className="py-7 text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-full bg-white/10 text-amber-400"><Phone className="size-6" /></span>
                <p className="mt-5 break-words text-lg font-extrabold">Dane kontaktowe w przygotowaniu</p>
                <p className="mt-2 text-sm leading-6 text-white/45">Numer telefonu zostanie uruchomiony po uzupełnieniu konfiguracji firmy.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-[#111210] px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-10 text-white sm:px-8 lg:px-12 lg:pb-8">
        <div className="mx-auto max-w-[1340px]">
          <div className="flex flex-col justify-between gap-10 border-b border-white/10 pb-12 sm:flex-row sm:items-end">
            <a href="#start" className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full bg-amber-400 text-sm font-black text-black">SAS</span>
              <span className="max-w-40 text-lg font-extrabold uppercase leading-[0.95] tracking-[-0.03em] text-amber-400">{siteConfig.name}</span>
            </a>
            <nav className="flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-white/55" aria-label="Nawigacja w stopce">
              <a className="hover:text-white" href="#korzysci">Korzyści</a>
              <a className="hover:text-white" href="#jak-dzialamy">Jak działamy</a>
              <a className="hover:text-white" href="#pojazdy">Pojazdy</a>
              <a className="hover:text-white" href="#zasieg">Śląsk</a>
              <a className="hover:text-white" href="#faq">FAQ</a>
            </nav>
          </div>
          <div className="grid gap-4 pt-6 text-xs leading-5 text-white/35 sm:grid-cols-[1fr_auto] sm:items-start">
            <div>
              <p>© {new Date().getFullYear()} {siteConfig.name}. Wszelkie prawa zastrzeżone.</p>
              {(siteConfig.legalName || siteConfig.address || siteConfig.nip || siteConfig.email) && (
                <p className="mt-2">
                  {[siteConfig.legalName, siteConfig.address, siteConfig.nip ? `NIP: ${siteConfig.nip}` : '', siteConfig.email]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
              <nav className="mt-3 flex flex-wrap gap-x-4 gap-y-2" aria-label="Prywatność i dokumenty">
                <a className="hover:text-white" href="/polityka-prywatnosci">Polityka prywatności</a>
                <a className="hover:text-white" href="/polityka-cookies">Polityka cookies</a>
                <CookieSettingsButton className="text-left hover:text-white" />
              </nav>
            </div>
            <p className="sm:text-right">Skup aut Śląsk · skup samochodów Katowice i okolice</p>
          </div>
        </div>
      </footer>

      <MobileContactBar
        href={primaryHref}
        phoneEnabled={phoneEnabled}
        companyName={siteConfig.name}
        googleAdsId={siteConfig.googleAdsId}
        googleAdsLabel={siteConfig.googleAdsPhoneConversionLabel}
      />
    </main>
  );
}
