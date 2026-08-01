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
