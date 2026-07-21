import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { sendLocationBatch } from './api-client';

const LOCATION_TASK = 'courier-location-tracking';
let isTracking = false;

export async function requestLocationPermissions() {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (!foreground.granted) return false;

  const background = await Location.requestBackgroundPermissionsAsync();
  return background.granted;
}

export async function getCurrentLocation(): Promise<Location.LocationObject | null> {
  try {
    return await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
  } catch {
    return null;
  }
}

TaskManager.defineTask(LOCATION_TASK, async ({ data: taskData, error: taskError }: { data: unknown; error: unknown }) => {
  if (taskError) return;
  const { locations } = taskData as { locations: Location.LocationObject[] };
  if (!locations?.length) return;

  const batch = locations.map((loc) => ({
    lat: loc.coords.latitude,
    lng: loc.coords.longitude,
    accuracy: loc.coords.accuracy ?? undefined,
    speed: loc.coords.speed ?? undefined,
    timestamp: loc.timestamp,
  }));

  try {
    await sendLocationBatch(batch);
  } catch {
    // Silently fail — locations will be sent next batch
  }
});

export async function startLocationTracking() {
  if (isTracking) return;
  isTracking = true;

  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 15000,
    distanceInterval: 20,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Kurir Rumah Keripik',
      notificationBody: 'Melacak lokasi pengiriman...',
      notificationColor: '#c55a2b',
    },
  });
}

export async function stopLocationTracking() {
  isTracking = false;
  await Location.stopLocationUpdatesAsync(LOCATION_TASK);
}
