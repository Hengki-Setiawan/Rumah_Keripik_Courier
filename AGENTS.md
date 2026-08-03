# Rumah Keripik — Courier App

## Stack
- Expo SDK 57, React Native 0.86
- expo-router (Stack navigator)
- react-native-maps + OSRM public API
- expo-location (background GPS tracking)
- expo-image-picker (proof photo)
- expo-secure-store (auth token)
- expo-sqlite (future offline support)

## App Structure
- `app/login.tsx` — Login with phone + PIN
- `app/index.tsx` — Dashboard (list today's deliveries)
- `app/delivery/[id].tsx` — Delivery detail & actions
- `app/delivery/[id]/map.tsx` — Map with OSRM route
- `app/delivery/[id]/proof.tsx` — Photo + notes
- `app/delivery/[id]/success.tsx` — Success confirmation
- `app/delivery/[id]/fail.tsx` — Fail with reason
- `app/history.tsx` — Past deliveries
- `app/shift/index.tsx` — Clock-in/Clock-out shift management
- `app/earnings/index.tsx` — Earnings & payment history
- `app/sos/index.tsx` — SOS emergency alert
- `app/incidents/index.tsx` — Report incidents (kecelakaan, mogok, etc.)
- `app/notifications/index.tsx` — In-app notification inbox
- `app/stats/index.tsx` — Performance statistics & ranking

## Shared Components (`src/components/`)
- `Container.tsx` — Safe area wrapper with padding
- `Card.tsx` — Reusable card with optional accent border
- `StatusBadge.tsx` — Status badges (active, completed, failed, Siap_Dikirim, etc.)
- `Button.tsx` — Styled button with primary/secondary/danger/ghost variants
- `OfflineBanner.tsx` — Offline connectivity banner

## Key Backend APIs
All at `https://rumah-keripik.vercel.app/api/courier/`
- `POST /auth/login` — Login
- `GET /auth/me` — Profile
- `GET /deliveries/today` — Today's deliveries
- `POST /deliveries/:id/start` — Start delivery
- `POST /deliveries/:id/complete` — Complete delivery
- `POST /deliveries/:id/fail` — Fail delivery
- `POST /deliveries/:id/arrived` — Record arrival event
- `POST /location/batch` — Send GPS batch
- `GET /route/today` — Route waypoints
- `POST /route/optimize` — Optimize delivery route
- `POST /shift/clock-in` — Start shift
- `POST /shift/clock-out` — End shift (records total deliveries)
- `POST /incidents` — Report incident (kecelakaan, mogok, etc.)
- `POST /push-tokens` — Register Expo push notification token
- `GET /stats/me` — Performance stats (period=week|month)
- `GET /notifications` — Notification inbox (limit, unread filter)
- `PATCH /notifications` — Mark read (single or all)
- `POST /offers/respond` — Accept/reject delivery offer
- `POST /device` — Bind/unbind/verify device

## Admin APIs (`/api/admin/`)
- `GET /couriers` — Courier roster with status
- `GET /deliveries` — All deliveries
- `POST /dispatch/reassign` — Reassign delivery to another courier
- `POST /notifications/broadcast` — Broadcast notification to couriers
- `PATCH /incidents/[id]` — Resolve incident with response note
- `GET /payroll/calculate` — Payroll calculation per period

## Admin Pages (`(dashboard)/admin/`)
- `couriers/page.tsx` — Courier roster with search/filter
- `dispatch/page.tsx` — Dispatch center with reassign
- `payroll/page.tsx` — Payroll with monthly summaries
- `incidents/page.tsx` — Incident list with resolve modal
- `sync-health/page.tsx` — Sync health dashboard

## Theme
Same warm palette as the main app: beige bg (#faf6ef), orange accent (#c55a2b), green (#7f9f3e).

## Build
```sh
npx expo prebuild --no-install
cd android && ./gradlew assembleDebug --no-daemon
```

## EAS Update (OTA)
Fix JS tanpa rebuild APK. App terhubung ke EAS project `hengki_setiawan/rumah-kripik-courier` (projectId `f036e134-69ca-475c-8569-a72d8d42b435`, URL `https://u.expo.dev/f036e134-69ca-475c-8569-a72d8d42b435`).
- **Push update**: GitHub → Actions → `Push EAS Update (OTA)` → Run workflow (channel `production` = APK release). Pakai secret `EXPO_TOKEN`.
- **Setelah install APK v1.0.3+**: app cek update `ON_LOAD` (fallbackToCacheTimeout 0) → buka/tutup app untuk tarik update terbaru.
- **Yang BISA di-update**: logika JS/TS, UI, error handling (Sentry + logger murni JS).
- **Yang TIDAK bisa (harus rebuild APK)**: native module baru, AndroidManifest/permission baru, upgrade SDK.
- **Verifikasi update aktif**: `adb logcat -s ReactNativeJS:* | grep RK_COURIER` atau cek di app.
- Secrets GitHub: `EXPO_TOKEN` (akun hengki_setiawan), `EAS_PROJECT_ID`.
- `eas.json`: profile `production`/`preview` punya `channel` untuk EAS Update; APK build tetap via GitHub Actions (bukan EAS Build).

## Log system USB
- `src/lib/logger.ts` — override console.* dengan tag `[RK_COURIER]`, `ErrorUtils.setGlobalHandler` → Sentry + SQLite buffer.
- `src/lib/sqlite-db.ts` — tabel `app_logs` (buffer 500 baris), `saveLog`/`getRecentLogs`.
- Verifikasi live: `adb logcat -s ReactNativeJS:* | grep RK_COURIER`.

## Testing via USB (adb) — WAJIB BACA
Device fisik Itel S666LN (Android 13), id `117131543G002849`. Pastikan terhubung: `adb devices` (harus `device`, bukan kosong).
- **SCREENSHOT**: `adb shell screencap -p /sdcard/x.png` → `adb pull /sdcard/x.png <folder>` — taruh tiap halaman ke `../screenshot/<nama>.png` (atau `../ss/`). Beri nama sesuai bagian (contoh `02_dashboard.png`).
- **BACA LAYAR**: `adb shell uiautomator dump /sdcard/ui.xml` → pull → grep `text="..."` bounds. JANGAN andalkan screenshot visual (AI text-only) — ui.xml adalah sumber kebenaran teks.
- **NAVIGASI BOTTOM TAB** (layar 720x1612): tab bar di y≈1410. 4 segmen horizontal: Dashboard x≈120, Riwayat x≈360, Performa x≈540, Profil x≈690. Baris juga ada di y≈1430.
- **Back button**: koordinat berubah per layar — cari node `Clickable` tekst di region atas (misal `Kembali` ~ [76,124][179,162]).

### LOGIN - SISTEM BARU (PIN-only, single input) - 2026-08
- Login sekarang **PIN saja**, TANPA kolom nomor HP (`app/(auth)/login.tsx`).
- **Input PIN = SATU TextInput** (`testID="login-pin-input"`, `maxLength={6}`, `secureTextEntry`, `autoFocus`). Ketik: `adb shell input text 123456` LANGSUNG.
- Tombol submit: `testID="login-submit-btn"` / teks `Masuk ke Dashboard`.
- PIN kurir Budi = `123456`. API: `POST /api/courier/auth/login` body `{ pin }` (phone optional; backend cari kurir aktif by PIN hash).
- Error lokal cek `text` `Koneksi internet` / `PIN 6-digit`.

### TESTING VIA USB - JANGAN GUNAKAN KOORDINAT, GUNAKAN testID/resource-id
Semua interaksi HARUS memakai `resource-id` (testID) via uiautomator, BUKAN koordinat yang rapuh.

- **Dumping UI**: `adb shell uiautomator dump /sdcard/ui.xml` then `adb pull /sdcard/ui.xml <tmp>`. TestID muncul sbg `resource-id="..."`. Assert teks via `text="..."`.
- Screenshot: `adb shell screencap -p /sdcard/x.png` -> pull ke `../screenshot/<nama>.png`.

### PETA testID (resource-id) UTAMA
| Screen | testID |
|--------|--------|
| Login PIN input | `login-pin-input` |
| Login submit | `login-submit-btn` |
| Tab Dashboard | `tab-index` |
| Tab Riwayat | `tab-history` |
| Tab Performa | `tab-stats` |
| Tab Profil | `tab-profile` |
Tambah `testID` baru bila screen lain belum ada (pola `screen-elemen`).

### DEV DEEP-LINK (bypass login, HANYA __DEV__) - akses SEMUA halaman tanpa login
File: `src/lib/dev-router.ts`. Di dev build, deep link `rumah-kripik-courier://dev/<route>` auto-login (devSignIn) + navigasi.
**Perintah adb**:
```
adb shell am start -a android.intent.action.VIEW -d "rumah-kripik-courier://dev/dashboard"
adb shell am start -a android.intent.action.VIEW -d "rumah-kripik-courier://dev/shift"
adb shell am start -a android.intent.action.VIEW -d "rumah-kripik-courier://dev/earnings"
adb shell am start -a android.intent.action.VIEW -d "rumah-kripik-courier://dev/sos"
adb shell am start -a android.intent.action.VIEW -d "rumah-kripik-courier://dev/notifications"
adb shell am start -a android.intent.action.VIEW -d "rumah-kripik-courier://dev/delivery/123"
```
- Alias: dashboard/home, history/riwayat, stats/performa, profile/profil, shift, earnings/pendapatan, sos, incidents, settings, lock, notifications, delivery/<id>.
- **PENTING**: HANYA aktif `__DEV__`. Build release/prod tidak terpengaruh - deep link biasa tetap perlu login.
- Integrasi: `app/_layout.tsx` initDevRouter(devSignIn) + tryNavigateAfterDevLogin; `devSignIn` di `src/lib/auth-guard.tsx`.
