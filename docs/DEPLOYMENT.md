# Wdrożenie i domena

## Vercel

1. Utwórz projekt z własnego repozytorium.
2. Dodaj wszystkie zmienne z `.env.example` w ustawieniach środowiska produkcyjnego.
3. Ustaw `INFRA_PROVIDER=vercel`, `DATABASE_SSL=true` i połączenie do zarządzanego PostgreSQL.
4. Wykonaj `npm run db:migrate` z bezpiecznego środowiska CI lub komputera administracyjnego.
5. Wdróż, ale nie udostępniaj domeny klientom przed checklistą prywatności i testem IP.
6. Na Cloudflare codzienny Cron Trigger jest już zapisany w `wrangler.jsonc`
   (`03:15 UTC`). Dla innego hostingu skonfiguruj codzienne wywołanie
   `/api/cron/retention` z sekretem Bearer.

## Własny VPS

1. Uruchom PostgreSQL oraz aplikację z `docker compose --profile full up -d --build` albo użyj zewnętrznej bazy.
2. Postaw Nginx/Caddy/Traefik przed aplikacją, wymuś HTTPS i ogranicz bezpośredni dostęp do portu 3000.
3. Proxy ma usuwać przychodzący `X-Real-IP` i ustawiać go samodzielnie na podstawie adresu połączenia.
4. Ustaw `INFRA_PROVIDER=trusted-proxy` i `TRUSTED_PROXY_IP_HEADER=x-real-ip`.
5. Uruchom codziennie `npm run db:retention`, wykonuj szyfrowane `pg_dump` i testuj odtwarzanie.
6. Panel `/admin` warto dodatkowo ograniczyć VPN-em lub warstwą uwierzytelnienia reverse proxy.

## Cloudflare Workers — wybrany wariant

Projekt jest przygotowany do uruchomienia przez vinext, czyli zalecaną przez Cloudflare ścieżkę dla nowych aplikacji Next.js na Workers. Standardowy build Next.js pozostaje dostępny, a konfiguracja Cloudflare znajduje się w `vite.config.ts`, `wrangler.jsonc` i `worker.ts`.

### 1. Kontrola lokalna

Wymagany jest Node.js 22.13 lub nowszy.

```powershell
npm install
npm run cf:check
npm run cf:build
npm run cf:preview
```

`cf:preview` uruchamia lokalny runtime Workers na podstawie pliku wygenerowanego w `dist/server/wrangler.json`. Nie publikuje aplikacji.

### 2. PostgreSQL

Utwórz zarządzaną bazę PostgreSQL dostępną przez TLS. Sterownik `postgres` użyty w projekcie jest zgodny z Workers. W pierwszym wdrożeniu `DATABASE_URL` może być sekretem Workera. Hyperdrive można dodać później, gdy istnieje już prawdziwa baza i jej dane połączenia; wymaga to podania aplikacji `connectionString` z bindingu zamiast zwykłego sekretu.

Migrację wykonuj z zaufanego komputera administracyjnego albo chronionego CI, nie podczas obsługi żądania Workera:

```powershell
$env:DATABASE_URL="postgres://..."
$env:DATABASE_SSL="true"
npm run db:migrate
```

### 3. Sekrety Workers

Nie wpisuj sekretów do `wrangler.jsonc`. Dodaj je przez panel Cloudflare albo CLI:

```powershell
npx wrangler secret put DATABASE_URL
npx wrangler secret put IP_HASH_SECRET
npx wrangler secret put SESSION_SECRET
npx wrangler secret put ADMIN_EMAIL
npx wrangler secret put ADMIN_PASSWORD_HASH
npx wrangler secret put CRON_SECRET
```

Hash hasła wygeneruj wcześniej przez `npm run admin:hash-password`. Dane firmy, telefon oraz identyfikatory `GOOGLE_ANALYTICS_ID`, `GOOGLE_ADS_ID` i `GOOGLE_ADS_PHONE_CONVERSION_LABEL` mogą być zwykłymi zmiennymi Workers, ale do czasu otrzymania prawdziwych wartości pozostają puste. Lokalnie skopiuj `.dev.vars.example` do `.dev.vars`; prawdziwy `.dev.vars` jest ignorowany przez Git.

`wrangler.jsonc` ustawia `INFRA_PROVIDER=cloudflare`. System ufa wtedy wyłącznie adresowi `CF-Connecting-IP` nadpisywanemu przez platformę i pobiera kraj z `CF-IPCountry`. Weryfikacja botów używa reverse DNS oraz forward DNS przez `resolve4`/`resolve6`, które działają w runtime Workers.

### 4. Retencja

Wdrożenie Cloudflare uruchamia retencję codziennie o `03:15 UTC` przez natywny
Cron Trigger. Na innym hostingu codziennie wywołuj `POST /api/cron/retention` z
nagłówkiem `Authorization: Bearer <CRON_SECRET>`. Nie umieszczaj
`CRON_SECRET` w adresie URL.

### 5. Publikacja

Dopiero po ustawieniu bazy, migracji, sekretów i danych prawnych:

```powershell
npm run cf:build
npm run cf:deploy
```

Polecenie `cf:deploy` tworzy publiczne wdrożenie Workers, dlatego uruchamiaj je wyłącznie po świadomej decyzji właściciela. Ten etap nie został wykonany.

Po wdrożeniu zweryfikuj HTTP 403 dla testowo zablokowanego IP, rzeczywisty `CF-Connecting-IP`, logowanie `/admin`, zapis UTM/GCLID, retencję i brak publicznego dostępu do statystyk.

### 6. Zgody i GA4

1. Utwórz strumień danych „Sieć” w usłudze Google Analytics 4 dla docelowej domeny.
2. Skopiuj identyfikator pomiaru `G-...` do zmiennej Workers `GOOGLE_ANALYTICS_ID`.
3. Wdróż ponownie aplikację.
4. W czystym profilu przeglądarki sprawdź, że przed wyborem zgody nie ma żądania do `googletagmanager.com` ani `google-analytics.com`.
5. Po zgodzie analitycznej sprawdź raport czasu rzeczywistego. Następnie wycofaj zgodę w stopce i ponownie sprawdź brak żądań po przeładowaniu.

Panel `/admin` jest celowo wyłączony z GA4. Własny monitoring bezpieczeństwa działa niezależnie od zgody analitycznej i ma osobną, konfigurowalną retencję.

## Podłączenie domeny

1. Kup/wybierz domenę i skonfiguruj ją w hostingu.
2. Dodaj rekordy A/AAAA lub CNAME dokładnie według instrukcji hostingu.
3. Poczekaj na poprawny certyfikat TLS.
4. Ustaw `SITE_URL=https://twoja-domena.pl` bez ukośnika na końcu.
5. Wdróż ponownie. Canonical, Open Graph, `robots.txt` i `sitemap.xml` użyją tego originu.
6. Sprawdź `https://twoja-domena.pl/robots.txt`, `/sitemap.xml`, źródło HTML i JSON-LD.
7. Dodaj sitemapę do Google Search Console dopiero po zatwierdzeniu treści i prywatności.

## Migracje bez przestoju

Migracje są jednokierunkowe i rejestrowane w `schema_migrations`. Przed każdą migracją wykonaj backup. Najpierw uruchamiaj migrację kompatybilną wstecz, potem aplikację, a dopiero w późniejszej wersji usuwaj stare kolumny. Pierwsza migracja jest idempotentna.
