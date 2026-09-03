'use client';

import { FormEvent, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  CarFront,
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Gauge,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';

const brands = [
  'Audi',
  'BMW',
  'Ford',
  'Mercedes-Benz',
  'Opel',
  'Škoda',
  'Toyota',
  'Volkswagen',
  'Inna',
];

const cities = [
  'Katowice',
  'Gliwice',
  'Tychy',
  'Sosnowiec',
  'Zabrze',
  'Bytom',
  'Rybnik',
  'Chorzów',
  'Dąbrowa Górnicza',
  'Bielsko-Biała',
];

function ValuationForm({ compact = false }: { compact?: boolean }) {
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }

  if (sent) {
    return (
      <div className={`grid place-items-center text-center ${compact ? 'min-h-64' : 'min-h-72'}`} role="status">
        <span className="mb-5 grid size-16 place-items-center rounded-full bg-primary text-primary-foreground">
          <CheckCircle2 className="size-8" />
        </span>
        <h3 className="text-2xl font-black tracking-[-0.04em]">Dziękujemy!</h3>
        <p className="mt-2 max-w-xs text-sm leading-6 text-[#676b62]">
          Zgłoszenie zostało przyjęte. Skontaktujemy się, aby dokończyć bezpłatną wycenę.
        </p>
        <Button variant="outline" className="mt-5 rounded-full" onClick={() => setSent(false)}>
          Wyceń kolejne auto
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <NativeSelect className="w-full" required aria-label="Marka samochodu">
        <NativeSelectOption value="">Wybierz markę</NativeSelectOption>
        {brands.map((brand) => (
          <NativeSelectOption key={brand} value={brand}>{brand}</NativeSelectOption>
        ))}
      </NativeSelect>
      <div className="grid grid-cols-2 gap-3">
        <Input required className="h-12 border-[#dfe2d9] bg-[#f7f8f4] px-4" placeholder="Model" aria-label="Model auta" />
        <Input required className="h-12 border-[#dfe2d9] bg-[#f7f8f4] px-4" placeholder="Rok produkcji" inputMode="numeric" aria-label="Rok produkcji" />
      </div>
      {!compact && (
        <Input className="h-12 border-[#dfe2d9] bg-[#f7f8f4] px-4" placeholder="Przebieg (opcjonalnie)" inputMode="numeric" aria-label="Przebieg auta" />
      )}
      <Input required className="h-12 border-[#dfe2d9] bg-[#f7f8f4] px-4" placeholder="Numer telefonu" inputMode="tel" aria-label="Numer telefonu" />
      <Button type="submit" className="h-14 w-full rounded-xl bg-[#11130f] text-base font-extrabold text-white hover:bg-[#2c3027]">
        Otrzymaj bezpłatną wycenę <ArrowUpRight className="ml-1 size-5" />
      </Button>
      <p className="flex items-center justify-center gap-2 pt-1 text-center text-[11px] text-[#777b72]">
        <ShieldCheck className="size-3" /> Wycena jest darmowa i niezobowiązująca
      </p>
    </form>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="border-b border-white/10 bg-[#0a0b0a] text-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-3 text-[12px] font-medium sm:px-8 lg:px-12">
          <p className="flex items-center gap-2 text-white/60">
            <MapPin className="size-3.5 text-primary" /> Całe województwo śląskie
          </p>
          <p className="hidden text-white/60 sm:block">Dojazd i wycena bez opłat</p>
        </div>
      </div>

      <header className="absolute inset-x-0 top-[41px] z-20 text-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
          <a href="#" className="flex items-center gap-3" aria-label="Silesian Auto Skup — strona główna">
            <span className="grid size-10 place-items-center rounded-full bg-primary text-[13px] font-black tracking-tighter text-primary-foreground">SAS</span>
            <span className="text-[17px] font-extrabold uppercase leading-none tracking-[-0.03em]">
              Silesian<br /><span className="text-primary">Auto Skup</span>
            </span>
          </a>
          <nav className="hidden items-center gap-8 text-sm font-semibold lg:flex" aria-label="Główna nawigacja">
            <a className="text-white/70 transition hover:text-white" href="#jak-dzialamy">Jak działamy</a>
            <a className="text-white/70 transition hover:text-white" href="#dlaczego-my">Dlaczego my</a>
            <a className="text-white/70 transition hover:text-white" href="#zasieg">Gdzie działamy</a>
            <a className="text-white/70 transition hover:text-white" href="#faq">FAQ</a>
          </nav>
          <a href="#wycena" className="inline-flex h-10 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 text-sm font-bold backdrop-blur-md transition hover:bg-white hover:text-black">
            Darmowa wycena <ArrowUpRight className="size-4" />
          </a>
        </div>
      </header>

      <section className="relative isolate min-h-[860px] bg-[#0a0b0a] text-white lg:min-h-[780px]">
        <div className="absolute inset-0 -z-20">
          <img
            src="https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=2200&q=88"
            alt="Nowoczesny samochód sportowy na drodze"
            className="h-full w-full object-cover object-[62%_center] opacity-55"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#0a0b0a_0%,rgba(10,11,10,.94)_38%,rgba(10,11,10,.28)_72%,rgba(10,11,10,.58)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-[#0a0b0a] to-transparent" />
        </div>

        <div className="mx-auto grid min-h-[860px] max-w-[1440px] items-center gap-10 px-5 pb-14 pt-40 sm:px-8 lg:min-h-[780px] lg:grid-cols-[1fr_430px] lg:px-12 lg:pb-16 lg:pt-32">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              <span className="size-1.5 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" /> Skup aut na Śląsku
            </div>
            <h1 className="text-[clamp(3.35rem,7vw,6.7rem)] font-black uppercase leading-[0.84] tracking-[-0.075em]">
              Sprzedaj auto.<br />
              <span className="text-primary">Bez zbędnych</span><br />formalności.
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-white/65 sm:text-lg">
              Uczciwa wycena, płatność od ręki i odbiór samochodu nawet tego samego dnia — w każdym mieście województwa śląskiego.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-white/80">
              {['Każdy stan techniczny', 'Gotówka lub przelew', 'Dojazd gratis'].map((item) => (
                <span key={item} className="flex items-center gap-2"><Check className="size-4 text-primary" />{item}</span>
              ))}
            </div>
          </div>

          <aside id="wycena" className="scroll-mt-6 rounded-[28px] border border-white/15 bg-white p-6 text-[#11130f] shadow-2xl shadow-black/30 sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6b6f66]">Szybki formularz</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.045em]">Ile warte jest<br />Twoje auto?</h2>
              </div>
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary">
                <ShieldCheck className="size-5" />
              </span>
            </div>
            <ValuationForm compact />
          </aside>
        </div>
        <a href="#jak-dzialamy" aria-label="Przejdź dalej" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 rounded-full border border-white/20 p-3 text-white/60 transition hover:text-primary lg:block">
          <ArrowDown className="size-4" />
        </a>
      </section>

      <section className="border-y border-[#dfe2d8] bg-[#f1f3ec]">
        <div className="mx-auto grid max-w-[1440px] divide-y divide-[#dfe2d8] px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-8 lg:px-12">
          {[
            ['~15 min', 'na wstępną wycenę'],
            ['0 zł', 'za dojazd rzeczoznawcy'],
            ['1 dzień', 'może wystarczyć do sprzedaży'],
          ].map(([value, label]) => (
            <div key={label} className="flex items-baseline justify-center gap-3 py-7 sm:flex-col sm:items-start sm:px-8 lg:flex-row lg:items-baseline lg:px-12">
              <strong className="text-3xl font-black tracking-[-0.05em]">{value}</strong>
              <span className="text-sm text-[#6c7167]">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="jak-dzialamy" className="scroll-mt-10 bg-[#f9faf5] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1340px]">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="eyebrow">Prosty proces</p>
              <h2 className="section-title mt-4">Od zgłoszenia<br />do zapłaty.</h2>
            </div>
            <p className="max-w-xl text-lg leading-8 text-[#666b61] lg:justify-self-end">
              Bez wystawiania ogłoszeń, dziesiątek telefonów i przypadkowych oględzin. Organizujemy sprzedaż w trzech konkretnych krokach.
            </p>
          </div>

          <div className="mt-16 grid gap-4 md:grid-cols-3">
            {[
              { n: '01', icon: Phone, title: 'Opowiedz nam o aucie', copy: 'Wypełnij krótki formularz. Marka, model, rocznik i numer telefonu wystarczą na start.' },
              { n: '02', icon: Gauge, title: 'Poznaj naszą ofertę', copy: 'Wstępnie wyceniamy samochód, a szczegóły potwierdzamy podczas bezpłatnych oględzin.' },
              { n: '03', icon: Banknote, title: 'Odbierz pieniądze', copy: 'Podpisujemy przejrzystą umowę, płacimy gotówką lub przelewem i odbieramy samochód.' },
            ].map(({ n, icon: Icon, title, copy }) => (
              <article key={n} className="group relative min-h-80 overflow-hidden rounded-[24px] border border-[#dfe2d8] bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-[#bdc1b5] hover:shadow-xl hover:shadow-[#182010]/5 sm:p-9">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#8b9084]">/{n}</span>
                  <span className="grid size-12 place-items-center rounded-full bg-[#eef1e8] transition group-hover:bg-primary"><Icon className="size-5" /></span>
                </div>
                <h3 className="mt-20 text-2xl font-black tracking-[-0.04em]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#6c7167]">{copy}</p>
                <div className="absolute bottom-0 left-0 h-1 w-0 bg-primary transition-all duration-500 group-hover:w-full" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="dlaczego-my" className="scroll-mt-10 bg-[#10120f] px-5 py-24 text-white sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-[1340px] gap-14 lg:grid-cols-[1fr_1fr] lg:gap-24">
          <div className="relative min-h-[520px] overflow-hidden rounded-[28px]">
            <img
              src="https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=1400&q=85"
              alt="Kluczyki przekazywane przy sprzedaży samochodu"
              className="absolute inset-0 h-full w-full object-cover grayscale-[25%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-7 left-7 right-7 flex items-end justify-between rounded-2xl border border-white/15 bg-black/35 p-5 backdrop-blur-md">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">Twoja decyzja</p>
                <p className="mt-1 font-bold">Oferta bez zobowiązań</p>
              </div>
              <ShieldCheck className="size-7 text-primary" />
            </div>
          </div>
          <div className="self-center">
            <p className="eyebrow text-primary">Dlaczego Silesian</p>
            <h2 className="section-title mt-4 text-white">Sprzedaż auta<br />na jasnych zasadach.</h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/55">
              Otrzymujesz konkretną ofertę i sam decydujesz, czy ją przyjmujesz. Bez ukrytych kosztów i bez nacisku.
            </p>
            <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
              {[
                { icon: FileCheck2, title: 'Minimum formalności', copy: 'Przygotowujemy dokumenty i wyjaśniamy każdy zapis przed podpisaniem.' },
                { icon: Truck, title: 'Odbiór także aut niesprawnych', copy: 'Możemy zorganizować transport samochodu, który nie powinien wyjeżdżać na drogę.' },
                { icon: Sparkles, title: 'Stan auta nie przekreśla sprzedaży', copy: 'Rozpatrujemy auta używane, powypadkowe, poleasingowe i z dużym przebiegiem.' },
              ].map(({ icon: Icon, title, copy }) => (
                <div key={title} className="grid grid-cols-[44px_1fr] gap-5 py-6">
                  <span className="grid size-11 place-items-center rounded-full border border-white/15 text-primary"><Icon className="size-5" /></span>
                  <div>
                    <h3 className="font-extrabold">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-white/45">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary px-5 py-6 text-primary-foreground sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1340px] flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm font-black uppercase tracking-[0.08em]">
          {['Osobowe', 'Dostawcze', 'Powypadkowe', 'Poleasingowe', 'Niesprawne'].map((item, index) => (
            <span key={item} className="flex items-center gap-10"><span>{item}</span>{index < 4 && <span className="size-1.5 rounded-full bg-black/40" />}</span>
          ))}
        </div>
      </section>

      <section id="zasieg" className="scroll-mt-10 bg-[#eef1e8] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1340px]">
          <div className="grid gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="eyebrow">Blisko Ciebie</p>
              <h2 className="section-title mt-4">Dojeżdżamy<br />w całym regionie.</h2>
              <p className="mt-6 max-w-lg text-base leading-7 text-[#666b61]">
                Nie musisz przywozić auta do komisu. Umawiamy oględziny pod wskazanym adresem, w dogodnym terminie.
              </p>
              <a href="#wycena-koncowa" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#11130f] px-6 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#2d3128]">
                Umów bezpłatny dojazd <ArrowRight className="size-4" />
              </a>
            </div>
            <div className="relative overflow-hidden rounded-[28px] border border-[#d4d8cc] bg-[#e6e9df] p-6 sm:p-10">
              <div className="absolute -right-16 -top-24 size-72 rounded-full border-[54px] border-primary/60" />
              <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-3">
                {cities.map((city, index) => (
                  <div key={city} className={`flex min-h-24 items-end rounded-2xl border p-4 ${index === 0 ? 'border-[#11130f] bg-[#11130f] text-white' : 'border-[#cdd1c5] bg-[#f7f8f3]'}`}>
                    <span className="flex items-center gap-2 text-sm font-bold"><MapPin className={`size-4 ${index === 0 ? 'text-primary' : 'text-[#7f8578]'}`} />{city}</span>
                  </div>
                ))}
                <div className="flex min-h-24 items-center justify-center rounded-2xl border border-dashed border-[#aeb4a5] p-4 text-center text-sm font-bold text-[#656a60]">+ pozostałe miasta</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-10 bg-[#f9faf5] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-[1100px] gap-12 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="eyebrow">Najczęstsze pytania</p>
            <h2 className="section-title mt-4">Krótko<br />i konkretnie.</h2>
          </div>
          <Accordion defaultValue={['faq-1']} className="border-t border-[#d9ddd2]">
            {[
              ['faq-1', 'Czy wycena samochodu jest płatna?', 'Nie. Wstępna wycena i dojazd na oględziny są bezpłatne. Przedstawiona oferta nie zobowiązuje Cię do sprzedaży.'],
              ['faq-2', 'Jakie samochody kupujecie?', 'Rozpatrujemy auta osobowe i dostawcze w różnym stanie — sprawne, uszkodzone, powypadkowe, poleasingowe oraz z dużym przebiegiem.'],
              ['faq-3', 'Jak szybko mogę sprzedać auto?', 'Jeśli zaakceptujesz ofertę i dokumenty są kompletne, transakcję można sfinalizować nawet podczas jednego spotkania.'],
              ['faq-4', 'Jakie dokumenty przygotować?', 'Najczęściej potrzebne są dowód rejestracyjny, dokument tożsamości, karta pojazdu — jeśli była wydana — oraz dokument potwierdzający prawo do sprzedaży.'],
              ['faq-5', 'Czy odbieracie niesprawne samochody?', 'Tak. Po wcześniejszym ustaleniu możemy zorganizować odbiór auta, które nie może bezpiecznie poruszać się po drodze.'],
            ].map(([value, question, answer]) => (
              <AccordionItem key={value} value={value} className="border-b border-[#d9ddd2]">
                <AccordionTrigger className="py-6 text-base font-extrabold hover:no-underline sm:text-lg">{question}</AccordionTrigger>
                <AccordionContent className="max-w-2xl pb-6 pr-8 text-sm leading-7 text-[#696e64]">{answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section id="wycena-koncowa" className="scroll-mt-10 bg-[#10120f] px-5 py-20 text-white sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto grid max-w-[1180px] gap-10 overflow-hidden rounded-[32px] bg-primary p-6 text-primary-foreground sm:p-10 lg:grid-cols-[1fr_440px] lg:items-center lg:p-14">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-black/15 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.15em]"><Clock3 className="size-3.5" /> Zacznij teraz</span>
            <h2 className="mt-6 text-[clamp(2.9rem,5vw,5.4rem)] font-black uppercase leading-[0.9] tracking-[-0.065em]">Sprawdź, ile<br />możemy zapłacić.</h2>
            <p className="mt-5 max-w-lg text-base font-medium leading-7 text-black/60">Podaj podstawowe dane auta. Resztę ustalimy podczas krótkiej rozmowy.</p>
          </div>
          <div className="rounded-[24px] bg-white p-6 text-[#11130f] shadow-xl sm:p-8">
            <ValuationForm />
          </div>
        </div>
      </section>

      <footer className="bg-[#10120f] px-5 pb-8 pt-14 text-white sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1340px]">
          <div className="flex flex-col justify-between gap-10 border-b border-white/10 pb-12 sm:flex-row sm:items-end">
            <a href="#" className="flex items-center gap-3" aria-label="Silesian Auto Skup — wróć na górę">
              <span className="grid size-11 place-items-center rounded-full bg-primary text-sm font-black text-primary-foreground">SAS</span>
              <span className="text-xl font-extrabold uppercase leading-none tracking-[-0.03em]">Silesian<br /><span className="text-primary">Auto Skup</span></span>
            </a>
            <div className="flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-white/55">
              <a className="hover:text-white" href="#jak-dzialamy">Jak działamy</a>
              <a className="hover:text-white" href="#dlaczego-my">Dlaczego my</a>
              <a className="hover:text-white" href="#zasieg">Gdzie działamy</a>
              <a className="hover:text-white" href="#faq">FAQ</a>
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-6 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Silesian Auto Skup. Wszelkie prawa zastrzeżone.</p>
            <p>Skup samochodów · województwo śląskie</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
