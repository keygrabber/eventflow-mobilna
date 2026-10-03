# EventFlow Organizer — React Native + Laravel API

Projekt: `C:\hackyeah2026\eventflow mobilna`. Mobilna aplikacja organizatora imprez masowych zintegrowana z backendem Laravel (`eventflow-backend`).

## Szybkie uruchomienie

### 1. Backend Laravel (port 8000)
W katalogu `eventflow-backend`:
```powershell
php artisan serve
```
Backend nasłuchuje na `127.0.0.1:8000`.

### 2. Aplikacja Expo (port 8081)
W katalogu `eventflow mobilna`:
```powershell
npx expo start --tunnel
```
LUB (jeśli telefon i komputer są w tej samej sieci Wi-Fi):
```powershell
npx expo start --lan
```

Zeskanuj kod QR z terminala w aplikacji **Expo Go** na telefonie (Android lub iOS).

## Jak działa połączenie z API (Tunnel i LAN)

Aplikacja mobilna łączy się z backendem przez wbudowany w Metro Bundler przezroczysty reverse-proxy na ścieżce `/eventflow-api`:
- **W trybie Tunnel (`--tunnel`)**: telefon łączy się przez HTTPS z adresem `https://<id>.exp.direct/eventflow-api`, a Metro bezpiecznie przekazuje żądania do lokalnego backendu `http://127.0.0.1:8000/api/v1`. Nie ma potrzeby otwierania portów w zaporze ani konfigurowania adresu IP komputera!
- **W trybie LAN (`--lan`)**: telefon łączy się z `http://<IP_KOMPUTERA>:8081/eventflow-api`.
- **W przeglądarce (Web)**: `http://localhost:8081/eventflow-api`.

## Konta testowe do logowania w aplikacji

- **Organizator**: `klysiudev@zohomail.eu` / hasło: `makapaka`
- **Administrator**: `admin@eventflow.pl` / hasło: `password123`

Aplikacja uruchamia się domyślnie w bezpiecznym trybie podglądu danych na żywo (można przeglądać wydarzenia, strefy, obłożenie i alerty). Aby edytować strefy lub zamknąć alerty, przejdź do zakładki **Konto** i kliknij **Zaloguj się do konta**.

## Testy i weryfikacja kodu

```powershell
npm test          # 10 testów jednostkowych
npm run typecheck # TypeScript (tsc --noEmit)
npm run lint      # Expo ESLint
npm run export    # Kompilacja bundli produkcyjnych (Web, Android Hermes, iOS Hermes)
```
