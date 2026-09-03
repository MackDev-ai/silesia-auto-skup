# Wdrożenie i domena

## Vercel

1. Utwórz projekt z własnego repozytorium.
2. Dodaj wszystkie zmienne z `.env.example` w ustawieniach środowiska produkcyjnego.
3. Ustaw `INFRA_PROVIDER=vercel`, `DATABASE_SSL=true` i połączenie do zarządzanego PostgreSQL.
4. Wykonaj `npm run db:migrate` z bezpiecznego środowiska CI lub komputera administracyjnego.
5. Wdróż, ale nie udostępniaj domeny klientom przed checklistą prywatności i testem IP.
6. Skonfiguruj codzienny cron dla `/api/cron/retention` z sekretem Bearer.

## Własny VPS

1. Uruchom PostgreSQL oraz aplikację z `docker compose --profile full up -d --build` albo użyj zewnętrznej bazy.
2. Postaw Nginx/Caddy/Traefik przed aplikacją, wymuś HTTPS i ogranicz bezpośredni dostęp do portu 3000.
3. Proxy ma usuwać przychodzący `X-Real-IP` i ustawiać go samodzielnie na podstawie adresu połączenia.
4. Ustaw `INFRA_PROVIDER=trusted-proxy` i `TRUSTED_PROXY_IP_HEADER=x-real-ip`.
5. Uruchom codziennie `npm run db:retention`, wykonuj szyfrowane `pg_dump` i testuj odtwarzanie.
6. Panel `/admin` warto dodatkowo ograniczyć VPN-em lub warstwą uwierzytelnienia reverse proxy.

## Cloudflare

Standardowy kod używa Node.js Proxy i PostgreSQL. Przy wdrożeniu na Workers użyj aktualnego adaptera Next.js/OpenNext, połączenia PostgreSQL przez Hyperdrive lub bezpieczny sterownik HTTP oraz `INFRA_PROVIDER=cloudflare`. Przed wdrożeniem wykonaj test integracyjny, że `CF-Connecting-IP` pochodzi z platformy i nie jest nadpisywalny przez klienta. Nie wdrażaj tego wariantu bez dostosowania sterownika bazy do ograniczeń wybranego runtime.

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
