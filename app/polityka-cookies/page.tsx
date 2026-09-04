import type { Metadata } from 'next';

import { CookieSettingsButton } from '@/components/privacy/cookie-settings-button';
import { LegalPageShell } from '@/components/privacy/legal-page-shell';
import { getCanonicalUrl, siteConfig } from '@/lib/config';

export const metadata: Metadata = {
  title: `Polityka cookies — ${siteConfig.name}`,
  description: `Informacje o cookies niezbędnych, analitycznych i marketingowych w serwisie ${siteConfig.name}.`,
  alternates: { canonical: getCanonicalUrl('/polityka-cookies') },
};

export default function CookiePolicyPage() {
  return (
    <LegalPageShell
      eyebrow="Cookies"
      title="Polityka cookies"
      lead="Cookies niezbędne utrzymują bezpieczeństwo serwisu. Analitykę i pomiar reklam uruchamiamy dopiero po dobrowolnej zgodzie."
    >
      <section>
        <h2>1. Czym są cookies</h2>
        <p>
          Cookies to krótkie informacje zapisywane w przeglądarce. Mogą być potrzebne do działania
          zabezpieczeń i sesji albo — po zgodzie — do tworzenia zbiorczych statystyk i pomiaru reklam.
          Podobne technologie mogą korzystać z pamięci przeglądarki lub identyfikatorów przesyłanych
          razem z żądaniem.
        </p>
      </section>

      <section>
        <h2>2. Cookies używane przez serwis</h2>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Nazwa</th>
                <th>Kategoria i cel</th>
                <th>Czas</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>sas_cookie_consent</code></td>
                <td>Niezbędne — zapamiętuje wybór prywatności.</td>
                <td>180 dni</td>
              </tr>
              <tr>
                <td><code>sas_visit_id</code></td>
                <td>Niezbędne — łączy kliknięcie kontaktowe z wizytą w systemie bezpieczeństwa.</td>
                <td>24 godziny</td>
              </tr>
              <tr>
                <td><code>sas_admin_session</code></td>
                <td>Niezbędne — podpisana sesja prywatnego panelu administratora; HttpOnly.</td>
                <td>8 godzin</td>
              </tr>
              <tr>
                <td><code>_ga</code>, <code>_ga_*</code></td>
                <td>Analityczne — rozróżnianie użytkowników i sesji Google Analytics 4.</td>
                <td>Zwykle do 2 lat</td>
              </tr>
              <tr>
                <td><code>_gcl_*</code> i powiązane identyfikatory Google</td>
                <td>Marketingowe — pomiar skuteczności Google Ads po zgodzie.</td>
                <td>Zależnie od konfiguracji Google, zwykle do 90 dni</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Dokładny zestaw cookies Google może zmieniać się wraz z konfiguracją usługi i przeglądarką.
          Jeśli identyfikator GA4 lub Google Ads nie jest skonfigurowany, dana kategoria pozostaje
          nieaktywna i odpowiednie cookies nie są ustawiane przez stronę.
        </p>
      </section>

      <section>
        <h2>3. Jak działa zgoda</h2>
        <p>
          Przy pierwszej wizycie można zaakceptować opcjonalne narzędzia, pozostawić tylko niezbędne
          cookies albo wybrać kategorie osobno. Brak zgody nie blokuje dostępu do treści ani kontaktu.
        </p>
        <p>
          W tym serwisie stosujemy podstawowy wariant zgody: skrypty Google nie są ładowane i nie
          wysyłają danych przed udzieleniem zgody. Wybór można równie łatwo zmienić lub wycofać:
        </p>
        <CookieSettingsButton className="inline-flex h-12 items-center rounded-full bg-[#111210] px-6 text-sm font-black text-white hover:bg-[#2b2e28]" />
      </section>

      <section>
        <h2>4. Ustawienia przeglądarki</h2>
        <p>
          Cookies można również usuwać lub blokować w ustawieniach przeglądarki. Zablokowanie
          wszystkich cookies może uniemożliwić zapamiętanie wyboru albo zalogowanie do prywatnego
          panelu, ale podstawowa treść strony pozostaje dostępna.
        </p>
      </section>

      <section>
        <h2>5. Dane zapisywane po stronie serwera</h2>
        <p>
          Niezależny monitoring bezpieczeństwa zapisuje ograniczone dane techniczne po stronie
          serwera. Nie jest to Google Analytics i nie zależy od opcjonalnych cookies. Zakres, cele,
          podstawy i retencję opisuje{' '}
          <a href="/polityka-prywatnosci">polityka prywatności</a>.
        </p>
      </section>
    </LegalPageShell>
  );
}

