import type { Metadata } from 'next';

import { LegalPageShell } from '@/components/privacy/legal-page-shell';
import { getCanonicalUrl, riskConfig, siteConfig } from '@/lib/config';

export const metadata: Metadata = {
  title: `Polityka prywatności — ${siteConfig.name}`,
  description: `Zasady przetwarzania danych i ochrony prywatności w serwisie ${siteConfig.name}.`,
  alternates: { canonical: getCanonicalUrl('/polityka-prywatnosci') },
};

function ControllerDetails() {
  const details = [
    siteConfig.legalName || siteConfig.name,
    siteConfig.address,
    siteConfig.nip ? `NIP: ${siteConfig.nip}` : '',
  ].filter(Boolean);

  return (
    <>
      <p>{details.join(', ')}.</p>
      {siteConfig.email ? (
        <p>
          Kontakt w sprawach prywatności:{' '}
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.
        </p>
      ) : (
        <p>Adres kontaktowy zostanie wskazany na stronie przed publicznym uruchomieniem serwisu.</p>
      )}
    </>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      eyebrow="Prywatność"
      title="Polityka prywatności"
      lead="Wyjaśniamy, jakie dane są przetwarzane podczas korzystania z serwisu, w jakim celu i jakie prawa przysługują użytkownikowi."
    >
      <section>
        <h2>1. Administrator danych</h2>
        <ControllerDetails />
      </section>

      <section>
        <h2>2. Zakres i źródło danych</h2>
        <p>
          Strona nie zawiera formularza wyceny ani formularza kontaktowego. Nie zbieramy przez nią
          marki, modelu, rocznika, przebiegu auta ani danych właściciela pojazdu.
        </p>
        <p>Podczas wizyty serwer może przetwarzać ograniczone dane techniczne:</p>
        <ul>
          <li>adres IP i jego skrót kryptograficzny, datę i godzinę oraz odwiedzony adres;</li>
          <li>referrer, stronę wejścia, parametry UTM oraz identyfikator gclid, jeśli występują w adresie;</li>
          <li>user-agent, typ urządzenia i kraj wyłącznie z zaufanego nagłówka infrastruktury;</li>
          <li>liczbę wcześniejszych wizyt, wynik ryzyka, decyzję bezpieczeństwa i jej przyczyny;</li>
          <li>informację o kliknięciu w telefon lub WhatsApp, bez treści rozmowy i bez numeru użytkownika.</li>
        </ul>
        <p>
          Jeżeli użytkownik sam skontaktuje się telefonicznie lub e-mailowo, przetwarzane będą dane,
          które dobrowolnie poda w rozmowie lub wiadomości.
        </p>
      </section>

      <section>
        <h2>3. Cele i podstawy przetwarzania</h2>
        <ul>
          <li>
            obsługa zapytania i podjęcie działań przed zawarciem umowy — art. 6 ust. 1 lit. b RODO;
          </li>
          <li>
            ochrona serwisu, ograniczanie automatycznego i nadużyciowego ruchu, prowadzenie logów
            administracyjnych oraz dochodzenie lub obrona roszczeń — prawnie uzasadniony interes
            administratora, art. 6 ust. 1 lit. f RODO;
          </li>
          <li>
            zbiorcza analiza korzystania ze strony w Google Analytics 4 oraz pomiar Google Ads —
            wyłącznie po zgodzie, art. 6 ust. 1 lit. a RODO.
          </li>
        </ul>
        <p>
          Zgodę można wycofać w dowolnym momencie przez panel ustawień udostępniany przez platformę
          zarządzania zgodą (CMP). Wycofanie zgody nie wpływa na zgodność z prawem wcześniejszego
          przetwarzania.
        </p>
      </section>

      <section>
        <h2>4. Własny monitoring bezpieczeństwa</h2>
        <p>
          Serwis korzysta z własnego, niezależnego systemu oceny ruchu. System nie tworzy reklamowego
          profilu osoby i nie uznaje automatycznie powtarzającego się adresu IP za oszustwo. Uwzględnia,
          że jeden adres może być współdzielony przez sieć firmową, komórkową lub NAT.
        </p>
        <p>
          Wynik ryzyka może spowodować oznaczenie wizyty do ręcznego sprawdzenia albo czasowe
          ograniczenie dostępu z danego IP. Taka decyzja dotyczy wyłącznie bezpieczeństwa serwisu,
          nie rozstrzyga o zawarciu umowy ani o wycenie samochodu. Administrator może sprawdzić i
          cofnąć blokadę.
        </p>
      </section>

      <section>
        <h2>5. Google Analytics i Google Ads</h2>
        <p>
          Google Analytics 4 i pomiar konwersji Google Ads są zarządzane przez Google Tag Manager
          oraz certyfikowaną platformę CMP. Ich działanie zależy od statusu zgody przekazanego przez
          Consent Mode v2. Po zgodzie Google może przetwarzać m.in.
          identyfikatory cookies, dane o urządzeniu, przeglądarce i przybliżonej lokalizacji oraz
          informacje o odwiedzanych podstronach.
        </p>
        <p>
          Więcej informacji znajduje się w{' '}
          <a href="https://policies.google.com/privacy?hl=pl" rel="noreferrer" target="_blank">
            polityce prywatności Google
          </a>
          . Zakres zgody można zmienić w każdej chwili w panelu platformy CMP.
        </p>
      </section>

      <section>
        <h2>6. Odbiorcy i miejsce przetwarzania</h2>
        <p>
          Dane mogą być powierzane dostawcom niezbędnym do działania serwisu: Cloudflare (hosting,
          sieć i bezpieczeństwo), Neon (baza PostgreSQL), dostawcy poczty i telekomunikacji oraz —
          tylko po zgodzie — Google w zakresie usług analitycznych lub reklamowych.
        </p>
        <p>
          Niektórzy dostawcy mogą przetwarzać dane poza Europejskim Obszarem Gospodarczym. W takim
          przypadku przekazanie odbywa się na podstawie mechanizmów przewidzianych w RODO, takich jak
          decyzja stwierdzająca odpowiedni stopień ochrony lub standardowe klauzule umowne.
        </p>
      </section>

      <section>
        <h2>7. Okres przechowywania</h2>
        <ul>
          <li>
            rekordy wizyt i powiązane zdarzenia ryzyka: domyślnie {riskConfig.retentionDays} dni;
          </li>
          <li>cookie identyfikujące wizytę bezpieczeństwa: 24 godziny;</li>
          <li>wybór prywatności: przez okres wskazany w panelu platformy CMP;</li>
          <li>log działań administratora: maksymalnie 365 dni;</li>
          <li>
            aktywne reguły blokowania lub wyjątków: do usunięcia przez administratora albo upływu
            ustawionego terminu;
          </li>
          <li>
            dane z kontaktu: przez czas niezbędny do obsługi zapytania, realizacji umowy i okresu
            przedawnienia ewentualnych roszczeń.
          </li>
        </ul>
      </section>

      <section>
        <h2>8. Prawa użytkownika</h2>
        <p>
          W granicach przewidzianych przez RODO można żądać dostępu do danych, ich sprostowania,
          usunięcia, ograniczenia przetwarzania lub przeniesienia, a także wnieść sprzeciw wobec
          przetwarzania opartego na prawnie uzasadnionym interesie i wycofać zgodę.
        </p>
        <p>
          Osoba, która uważa, że jej dane są przetwarzane niezgodnie z prawem, może wnieść skargę do
          Prezesa Urzędu Ochrony Danych Osobowych. Informacje kontaktowe są dostępne na{' '}
          <a href="https://uodo.gov.pl/" rel="noreferrer" target="_blank">uodo.gov.pl</a>.
        </p>
      </section>

      <section>
        <h2>9. Zmiany polityki</h2>
        <p>
          Polityka może zostać zaktualizowana po zmianie konfiguracji serwisu, dostawców albo
          obowiązujących przepisów. Data aktualnej wersji jest widoczna na początku dokumentu.
        </p>
      </section>
    </LegalPageShell>
  );
}
