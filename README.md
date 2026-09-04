# Silesia Auto Skup

Kompletna, samodzielna aplikacja dla firmy skupującej samochody na Śląsku. Projekt zawiera responsywny one-page, backend monitorowania ruchu, PostgreSQL, punktację ryzyka, wczesne blokowanie żądań, prywatny panel administratora, eksport CSV, migracje, testy i konfigurację Docker.

Kod działa samodzielnie na hostingu właściciela. Własny monitoring bezpieczeństwa nie zależy od zewnętrznego trackera. Google Analytics 4 i Google Ads są opcjonalne, nieaktywne bez identyfikatorów i ładowane dopiero po zgodzie użytkownika.

## Stan wersji roboczej

- brak publicznego formularza — strona nie zbiera danych osoby sprzedającej ani danych auta;
- brak fikcyjnego telefonu i danych firmy;
- CTA przewijają do sekcji „Dane kontaktowe w przygotowaniu”;
- po ustawieniu `CONTACT_PHONE` CTA automatycznie używają `tel:+48...`;
- WhatsApp pojawia się dopiero po ustawieniu `WHATSAPP_NUMBER`;
- canonical, pełna mapa witryny i obrazy social są aktywowane po ustawieniu `SITE_URL`;
- projekt nie jest przeznaczony do publicznego uruchomienia przed wykonaniem checklisty z końca dokumentu.

## Technologia

- Next.js 16 / React 19 / TypeScript;
- PostgreSQL i parametryzowane zapytania przez `postgres`;
- Next.js Proxy do oceny ruchu przed wyrenderowaniem strony;
- niezależny build Next.js oraz build vinext dla Cloudflare Workers;
- własna sesja administratora podpisana HMAC, hasło PBKDF2-SHA256;
- Tailwind CSS 4;
- Vitest, Playwright i ESLint;
- wieloetapowy obraz Docker.

## Uruchomienie lokalne

Wymagania: Node.js 22.13+ oraz PostgreSQL 15+ albo Docker.

1. Skopiuj `.env.example` do `.env.local`.
2. Uzupełnij bezpieczne sekrety `IP_HASH_SECRET`, `SESSION_SECRET`, `CRON_SECRET` oraz `ADMIN_EMAIL`.
3. Wygeneruj hash hasła bez zapisywania jawnego hasła:

   ```powershell
   npm run admin:hash-password
   ```

   Wynik wklej jako `ADMIN_PASSWORD_HASH` do `.env.local`.
4. Uruchom PostgreSQL:

   ```powershell
   docker compose up -d db
   ```

   Jeżeli Docker nie jest dostępny, utwórz zwykłą bazę PostgreSQL i ustaw jej adres w `DATABASE_URL`.
5. Wykonaj migracje i uruchom aplikację:

   ```powershell
   npm install
   npm run db:migrate
   npm run dev
   ```

6. Strona jest dostępna pod `http://localhost:3000`, a logowanie administratora pod `http://localhost:3000/admin/login`.

## Zmienne środowiskowe

| Zmienna | Znaczenie |
|---|---|
| `COMPANY_NAME` | Nazwa firmy; domyślnie „Silesia Auto Skup” |
| `COMPANY_LEGAL_NAME` | Imię i nazwisko właściciela lub pełna nazwa prawna |
| `CONTACT_PHONE` | Telefon w formacie E.164, np. `+48...`; pusty = kontakt w przygotowaniu |
| `CONTACT_EMAIL` | Prawdziwy e-mail firmy; pusty nie jest publicznie wyświetlany |
| `SITE_URL` | Pełny origin, np. `https://domena.pl`; steruje canonical i sitemapą |
| `COMPANY_NIP` | NIP dodawany do danych strukturalnych dopiero po uzupełnieniu |
| `COMPANY_ADDRESS` | Adres działalności |
| `WHATSAPP_NUMBER` | Numer E.164 aktywujący przycisk WhatsApp |
| `GOOGLE_TAG_MANAGER_ID` | Identyfikator kontenera, np. `GTM-...`; pusty = GTM wyłączony |
| `DATABASE_URL` | Połączenie z PostgreSQL |
| `DATABASE_SSL` | `true` na hostingu z TLS; lokalnie zwykle `false` |
| `DATABASE_POOL_SIZE` | Maksymalna liczba połączeń procesu, domyślnie 5 |
| `INFRA_PROVIDER` | `direct`, `trusted-proxy`, `vercel` lub `cloudflare` |
| `TRUSTED_PROXY_IP_HEADER` | Nagłówek ustawiany i czyszczony przez własny reverse proxy, domyślnie `x-real-ip` |
| `VERIFY_SEARCH_BOTS_DNS` | Weryfikacja reverse+forward DNS Googlebota/Bingbota |
| `IP_HASH_SECRET` | Klucz HMAC do pseudonimizacji IP; nie zmieniać bez planu migracji |
| `SESSION_SECRET` | Klucz podpisu sesji administratora |
| `ADMIN_EMAIL` | Jedyny dozwolony login administratora |
| `ADMIN_PASSWORD_HASH` | Hash z `npm run admin:hash-password`; nigdy jawne hasło |
| `CRON_SECRET` | Token zadania retencji |
| `DATA_RETENTION_DAYS` | Retencja wizyt, domyślnie 30 dni |
| `RISK_*` | Centralne progi i punkty opisane w `.env.example` |

## Dodanie telefonu i WhatsAppa

Ustaw wyłącznie prawdziwe dane:

```dotenv
CONTACT_PHONE="+48XXXXXXXXX"
WHATSAPP_NUMBER="+48XXXXXXXXX"
```

Po ponownym uruchomieniu przyciski „Skontaktuj się” i mobilny sticky CTA użyją `tel:`. Przycisk WhatsApp zostanie dodany w sekcji kontaktowej. Kliknięcia są zapisywane jako zdarzenia bezpieczeństwa/jakości ruchu bez tworzenia profilu reklamowego.

## Zgody, Google Analytics 4 i Google Ads

Strona instaluje wyłącznie kontener Google Tag Manager. GA4, Google Ads, certyfikowana platforma CMP oraz Consent Mode v2 są konfigurowane wewnątrz kontenera przez obsługę marketingową:

```dotenv
GOOGLE_TAG_MANAGER_ID="GTM-XXXXXXXX"
```

Kliknięcia telefonu i WhatsApp są przekazywane do `dataLayer` jako `phone_click` i `whatsapp_click`. Reguły tagów i wymagania zgody ustawia się w GTM. Parametry `gclid` i wszystkie `utm_*` są nadal zapisywane przez własny backend w `visits`, razem ze stroną wejścia i referrerem.

System nie dodaje automatycznie wykluczeń IP do Google Ads. Administrator ręcznie wybiera „Zatwierdź do eksportu”, a dopiero później pobiera CSV. Wynik ryzyka nie jest dowodem oszustwa.

## Punktacja ryzyka

Domyślna logika jest w jednym miejscu: `lib/config.ts` i odpowiadających jej zmiennych `RISK_*`.

- 1–7 wizyt/IP/godzinę: brak punktów za częstotliwość;
- od 8 wizyt: co najmniej 40 punktów i decyzja `review`;
- częstotliwość rośnie maksymalnie do 60 punktów;
- 30 wizyt/godzinę: wymuszona decyzja `block`;
- podejrzany user-agent: +30;
- powtarzający się `gclid`: +30;
- bardzo szybkie kolejne żądanie: +20;
- powtarzające się wejścia bez akcji kontaktowej: +10;
- zaufany sygnał infrastruktury o centrum danych: +20;
- aktywna blokada IP: +100.

Decyzje: 0–39 `allow`, 40–79 `review`, od 80 `block`. Każdy powód trafia do `risk_reasons` i `risk_events`. Biała lista ma pierwszeństwo przed automatyczną oceną. Zweryfikowany bot wyszukiwarki jest przepuszczany, ale sama nazwa „Googlebot” w user-agencie nie wystarcza do uznania bota za legalnego.

## Blokowanie i rzeczywisty adres IP

`proxy.ts` działa przed renderowaniem strony. Dla decyzji `block` zwraca HTTP 403 i neutralny ekran „Dostęp czasowo ograniczony”. Automatyczna blokada jest czasowa; panel pozwala tworzyć blokady czasowe i bezterminowe, usuwać je oraz zarządzać białą listą.

W trybie `direct` aplikacja celowo ignoruje `X-Forwarded-For`. Na VPS reverse proxy musi nadpisywać `X-Real-IP`, a aplikacja musi mieć `INFRA_PROVIDER=trusted-proxy`. Na Vercel/Cloudflare wykorzystywane są wyłącznie nagłówki właściwe dla wskazanej platformy. Nie ustawiaj trybu platformowego poza tą platformą.

## Panel administratora

Panel `/admin` jest wykluczony w `robots.txt`, zwraca `X-Robots-Tag: noindex`, ma prywatny cache i wymaga podpisanej sesji HttpOnly/SameSite=Strict. Pokazuje statystyki dzienne, wizyty, kampanie, `gclid`, IP, ryzyko, przyczyny i status. Obsługuje wyszukiwanie, filtry, sortowanie, paginację, blokowanie, białą listę, ręczną weryfikację i CSV.

Mutacje wymagają ważnej sesji i zgodnego nagłówka `Origin`. React zabezpiecza dynamiczne treści przed wstrzyknięciem HTML; CSP, `X-Frame-Options`, `nosniff` i ograniczenia uprawnień są ustawiane globalnie. Każde logowanie, wylogowanie, działanie na IP i eksport jest audytowane.

## Retencja i kopie zapasowe

Ręczne czyszczenie:

```powershell
npm run db:retention
```

Można też codziennie wywołać `POST /api/cron/retention` z `Authorization: Bearer <CRON_SECRET>`. Rekordy `visits` starsze niż `DATA_RETENTION_DAYS` są usuwane, zależne `risk_events` znikają przez `ON DELETE CASCADE`, a wygasłe blokady są dezaktywowane. Log audytowy ma niezależną retencję 365 dni.

Przykład kopii PostgreSQL:

```powershell
pg_dump --format=custom --file=silesia-auto-skup.backup "$env:DATABASE_URL"
```

Odtworzenie wykonuj najpierw w środowisku testowym poleceniem `pg_restore`. Kopie szyfruj i przechowuj poza serwerem aplikacji.

## Testy i kontrola jakości

```powershell
npm test
npm run lint
npm run build
npx playwright test
```

Vitest obejmuje reguły `allow/review/block`, białą i czarną listę, UTM/GCLID, odporność na fałszywy `X-Forwarded-For`, ochronę panelu i mutacji, CSV, retencję, działanie treści bez JavaScript oraz koszt CPU silnika ryzyka. Playwright sprawdza widok desktop/mobile, mobilne CTA, brak publicznych formularzy, treść bez JS i czas odpowiedzi.

## Wdrożenie

Wybranym środowiskiem jest Cloudflare Workers. Projekt zawiera `wrangler.jsonc`, `vite.config.ts`, własny `worker.ts` z nagłówkami bezpieczeństwa oraz aktualny adapter vinext. Lokalna kontrola wariantu Cloudflare:

```powershell
npm run cf:check
npm run cf:build
npm run cf:preview
```

`cf:deploy` jest celowo oddzielnym poleceniem i nie zostało uruchomione. Przed nim należy skonfigurować PostgreSQL oraz sekrety Workers. Szczegółowa instrukcja znajduje się w `docs/DEPLOYMENT.md`. Konfigurację domeny wykonuje się później; samo ustawienie `SITE_URL` nie zmienia DNS.

## Przed publicznym uruchomieniem

- uzupełnij prawdziwy telefon, e-mail, NIP, adres i nazwę prawną;
- ustaw docelowe `SITE_URL` oraz rekordy DNS/TLS;
- zweryfikuj i zaakceptuj przygotowane wersje `/polityka-prywatnosci` i `/polityka-cookies`;
- oceń z prawnikiem podstawę, zakres i okres przetwarzania IP — dokumentacja nie jest poradą prawną;
- ustaw silne, unikalne sekrety i hash hasła;
- uruchom migracje, retencję, backup i monitoring dostępności;
- przetestuj poprawność adresu IP za docelowym proxy;
- ustaw własny identyfikator GA4/Google Ads i przetestuj oba warianty zgody;
- sprawdź telefon, WhatsApp, treści, dane strukturalne, robots i sitemapę na domenie;
- wykonaj `npm test`, `npm run lint`, `npm run build` oraz Playwright;
- ręcznie oceń początkowe progi ryzyka na realnym ruchu przed automatycznym blokowaniem agresywnych wzorców.
