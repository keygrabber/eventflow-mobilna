# Weryfikacja panelu organizatora — 2026-10-03

- 10 testów domenowych zakończonych powodzeniem: dane webowe i powiązania, walidacja zapisu, formularze, izolacja demo/API, progi, raporty i CSV, obliczenia symulacji, walidacja odpowiedzi API.
- TypeScript i Expo lint bez błędów.
- Eksport bundli Web, Android (Hermes) i iOS (Hermes) zakończony powodzeniem. To nie jest podpisany APK/IPA.
- W podglądzie RN Web: profil organizatora, dashboard 20 502 osób / 8 stref / 2 aktywne alerty, nawigacja, symulacja i unieważnianie wyniku po zmianie parametrów, raport 96 pomiarów / 8 stref, mapa, edycja pojemności i trwałość po odświeżeniu. Testową pojemność przywrócono do 10 000.
- Kontrola wyglądu: 390 px oraz końcowy podgląd 320 px.
- Eksport CSV pobrał plik do Downloads (1115 bajtów); potwierdzono polskie nagłówki, dane festiwalu i 8 stref. Zdarzenie pobrania w narzędziu przeglądarkowym miało timeout, lecz plik i jego zawartość zweryfikowano na dysku.
- Nie wykonano testów na fizycznym Androidzie/iPhonie. Natywne udostępnianie CSV, klawiatura i wycofanie dawnych przypomnień wymagają sprawdzenia na urządzeniu.
- Monitoring ma adapter istniejącego API, ale integracja z działającym serwerem nie została potwierdzona. Uwierzytelnianie i zapisy serwerowe nie istnieją w tym zakresie backendu.
- Instalacja zależności zgłosiła 34 pozycje npm audit (11 moderate, 23 high); nie zastosowano wymuszonej zmiany wersji SDK. Przed publikacją potrzebny przegląd zależności.

Zakres dalszych testów ograniczono zgodnie z prośbą użytkownika. Nie zmieniano kodu webowego ani backendu w tej iteracji.
