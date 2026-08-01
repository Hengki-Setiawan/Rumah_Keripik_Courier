import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { enqueueLocationPoints } from '../db/local-schema';

export const LOCATION_TASK_NAME = 'courier-background-location';

export type TrackingMode = 'idle' | 'active_delivery' | 'navigation';
let currentMode: TrackingMode | 'off' = 'off';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) return;
  const { locations } = data as { locations: Location.LocationObject[] };
  const points = locations.map((loc) => ({
    lat: loc.coords.latitude,
    lng: loc.coords.longitude,
    accuracy: loc.coords.accuracy ?? undefined,
    speed: loc.coords.speed ?? undefined,
    heading: loc.coords.heading ?? undefined,
    recorded_at: Date.now(),
  }));
  if (points.length > 0) {
    await enqueueLocationPoints(points);

    const last = points[points.length - 1];
    const dests = getActiveDestinations();
    for (const dest of dests) {
      if (!dest.triggered) {
        const distance = haversine(last.lat, last.lng, dest.lat, dest.lng);
        if (distance <= 100) {
          fetch(`https://rumah-keripik.vercel.app/api/courier/deliveries/${dest.deliveryId}/arrived`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: last.lat, lng: last.lng, source: 'geofence' }),
          }).catch(() => undefined);
          markTriggered(dest.deliveryId);
        }
      }
    }
  }
});

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

let activeDestinations: Array<{ deliveryId: number; lat: number; lng: number; triggered: boolean }> = [];

export function setActiveDestinations(dests: Array<{ deliveryId: number; lat: number; lng: number }>) {
  activeDestinations = dests.map((d) => ({ ...d, triggered: false }));
}

function getActiveDestinations() {
  return activeDestinations;
}

function markTriggered(deliveryId: number) {
  const found = activeDestinations.find((d) => d.deliveryId === deliveryId);
  if (found) found.triggered = true;
}

export async function startTracking(mode: TrackingMode) {
  const configs: Record<TrackingMode, Location.LocationTaskOptions> = {
    idle: {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 90000,
      distanceInterval: 100,
      foregroundService: {
        notificationTitle: 'Rumah Keripik Courier',
        notificationBody: 'Lokasi dilacak selama shift kerja',
        notificationColor: '#c55a2b',
      },
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
    },
    active_delivery: {
      accuracy: Location.Accuracy.High,
      timeInterval: 12000,
      distanceInterval: 25,
      foregroundService: {
        notificationTitle: 'Rumah Keripik Courier',
        notificationBody: 'Sedang mengantar — lokasi diperbarui lebih sering',
        notificationColor: '#c55a2b',
      },
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
    },
    navigation: {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 3000,
      distanceInterval: 5,
      foregroundService: {
        notificationTitle: 'Rumah Keripik Courier',
        notificationBody: 'Navigasi aktif — lokasi real-time',
        notificationColor: '#c55a2b',
      },
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
    },
  };

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, configs[mode]);
  currentMode = mode;
}

export async function stopTracking() {
  const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (isRunning) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
  currentMode = 'off';
}

export function getCurrentMode() {
  return currentMode;
}

export async function requestLocationPermissions() {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (!foreground.granted) return false;
  const background = await Location.requestBackgroundPermissionsAsync();
  return background.granted;
}
