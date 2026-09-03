# Architektura

## Przepływ publicznego żądania

1. `proxy.ts` uruchamia się dla dokumentu `/` przed renderowaniem.
2. Adapter infrastruktury z `lib/security/ip.ts` odczytuje IP wyłącznie ze źródła wskazanego przez `INFRA_PROVIDER`.
3. Backend liczy wizyty godzinowe, poprzednie wizyty, powtarzalny `gclid`, tempo żądań, akcje kontaktowe, blokadę i allowlistę.
4. Czysta funkcja `evaluateRisk` zwraca wynik, decyzję i listę przyczyn.
5. Wizyta i każde zdarzenie ryzyka są zapisywane w jednej transakcji PostgreSQL.
6. `block` powoduje HTTP 403 jeszcze przed renderowaniem strony; awaria samej analityki działa fail-open, aby nie wyłączyć witryny.
7. `allow` i `review` przechodzą do statycznie zoptymalizowanego one-page'a.

## Dane

- `visits`: wejścia, kampanie, IP i hash HMAC, user-agent, wynik, decyzja, przyczyny, status ręcznej oceny;
- `ip_blocks`: historia blokad czasowych/bezterminowych, automatycznych/ręcznych;
- `ip_allowlist`: zaufane IP;
- `risk_events`: atomowe powody punktacji i akcje kontaktowe;
- `admin_audit_log`: logowania, mutacje i eksporty.

Indeksy pokrywają IP/hash, czas, decyzję, kampanię, `gclid`, blokadę i ręczną weryfikację. Wszystkie wartości wejściowe są parametrami zapytań. Dynamiczna nazwa kolumny sortowania pochodzi z zamkniętej whitelisty.

## Granice bezpieczeństwa

- publiczna strona nie ma formularzy ani endpointu przyjmującego leady;
- panel ma osobną trasę, sesję HttpOnly/SameSite=Strict, CSP i `noindex`;
- hasło nie istnieje w kodzie, przechowywany jest wyłącznie mocny hash PBKDF2;
- endpointy modyfikujące wymagają sesji i zgodnego originu;
- eksportuje się wyłącznie IP ręcznie oznaczone jako `approved`;
- CSV neutralizuje formuły arkusza;
- logowanie ma limit prób oparty o audyt PostgreSQL;
- retencja usuwa stare wizyty i zdarzenia zależne.

## Przenośność

Warstwa aplikacji jest standardowym Next.js w runtime Node.js. PostgreSQL jest wspólnym kontraktem dla Vercel, VPS i platform wspierających połączenie do Postgresa. Jedynym fragmentem zależnym od infrastruktury jest wybór zaufanego nagłówka IP. Nie ma zależności od dostawcy analityki ani systemu AI.

Na Cloudflare należy użyć wariantu Next.js dla Workers z Hyperdrive lub połączenia HTTP do dostawcy PostgreSQL oraz zachować `INFRA_PROVIDER=cloudflare`. Nie wolno przenosić kodu do runtime bez Node.js bez wymiany adaptera `postgres` i funkcji weryfikacji DNS.
