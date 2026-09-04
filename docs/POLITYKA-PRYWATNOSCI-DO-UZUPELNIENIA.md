# Weryfikacja prawna przed publikacją

Publiczne projekty dokumentów są już dostępne pod `/polityka-prywatnosci` i `/polityka-cookies`. Ten plik nie jest poradą prawną. Przed publicznym uruchomieniem właściciel powinien zlecić weryfikację treści dla rzeczywistej działalności, umów z dostawcami oraz przyjętej podstawy prawnej.

## Do potwierdzenia

- pełna nazwa administratora, adres, e-mail do realizacji praw i — po nadaniu — NIP;
- zgodność podstawy prawnej własnego monitoringu IP, UTM i gclid z rzeczywistym sposobem korzystania z raportów;
- zawarcie wymaganych umów powierzenia z Cloudflare, Neon i pozostałymi dostawcami;
- mechanizmy transferu poza EOG u faktycznie używanych dostawców;
- faktyczne okresy retencji, backupów, logów Cloudflare i danych w usługach Google;
- konfiguracja GA4 ograniczająca zakres danych oraz wyłączająca funkcje, które nie są potrzebne;
- aktualny wykaz cookies po uruchomieniu prawdziwych identyfikatorów GA4/Google Ads;
- sposób obsługi żądań osób i sprzeciwów wobec przetwarzania;
- okresowy ręczny przegląd blokad, z uwzględnieniem NAT, sieci komórkowych i współdzielonych IP.

## Test zgody

W czystej przeglądarce należy potwierdzić brak żądań do Google przed zgodą, prawidłowe działanie obu kategorii, możliwość odmowy bez utraty dostępu oraz równie łatwe wycofanie zgody w stopce. Wyniki testu warto zachować w dokumentacji wdrożeniowej.
