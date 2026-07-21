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

## Key Backend APIs
All at `https://rumah-keripik.vercel.app/api/courier/`
- `POST /auth/login` — Login
- `GET /auth/me` — Profile
- `GET /deliveries/today` — Today's deliveries
- `POST /deliveries/:id/start` — Start delivery
- `POST /deliveries/:id/complete` — Complete delivery
- `POST /deliveries/:id/fail` — Fail delivery
- `POST /location/batch` — Send GPS batch
- `GET /route/today` — Route waypoints

## Theme
Same warm palette as the main app: beige bg (#faf6ef), orange accent (#c55a2b), green (#7f9f3e).

## Build
```sh
npx expo prebuild --no-install
cd android && ./gradlew assembleDebug --no-daemon
```
