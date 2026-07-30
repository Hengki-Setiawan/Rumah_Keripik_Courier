import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { sendLocationBatch, getTodayDeliveries } from './api-client';
import { getToken } from './storage';
import { isWithinGeofence } from './geofence';

const LOCATION_TASK = 'courier-location-tracking';
let isTracking = false;
let lastSpeed = 0;

const OFFLINE_LOCATIONS_KEY = 'offline_locations';
const ARRIVED_CACHE_KEY = 'arrived_delivery_ids';
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://rumah-keripik.vercel.app';

function getAccuracyForSpeed(speed: number | null): Location.LocationAccuracy {
  const s = speed ?? 0;
  lastSpeed = s;
  if (s > 5) return Location.Accuracy.BestForNavigation;
  if (s > 1) return Location.Accuracy.Balanced;
  return Location.Accuracy.Low;
}

export async function requestLocationPermissions(): Promise<boolean> {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (!foreground.granted) return false;
  const background = await Location.requestBackgroundPermissionsAsync();
  return background.granted;
}

export async function getCurrentLocation(): Promise<Location.LocationObject | null> {
  try {
    return await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  } catch {
    return null;
  }
}

async function getArrivedCache(): Promise<Set<number>> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const raw = await AsyncStorage.getItem(ARRIVED_CACHE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

async function markArrived(deliveryId: number) {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const raw = await AsyncStorage.getItem(ARRIVED_CACHE_KEY);
    const set: number[] = raw ? JSON.parse(raw) : [];
    set.push(deliveryId);
    await AsyncStorage.setItem(ARRIVED_CACHE_KEY, JSON.stringify(set));
  } catch {}
}

async function checkGeofence(lat: number, lng: number) {
  try {
    const arrivedIds = await getArrivedCache();
    const data = await getTodayDeliveries();
    const inTransit = data.deliveries.filter(
      (d) => d.status === 'Dalam_Pengiriman' && !arrivedIds.has(d.id)
    );
    for (const delivery of inTransit) {
      const destLat = delivery.latitude ? parseFloat(delivery.latitude) : null;
      const destLng = delivery.longitude ? parseFloat(delivery.longitude) : null;
      if (destLat === null || destLng === null) continue;
      if (isWithinGeofence(lat, lng, destLat, destLng, 100)) {
        const token = await getToken();
        if (!token) continue;
        await fetch(`${BASE_URL}/api/courier/deliveries/${delivery.id}/arrived`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ lat, lng, source: 'geofence' }),
        });
        await markArrived(delivery.id);
      }
    }
  } catch {}
}

TaskManager.defineTask(LOCATION_TASK, async ({ data: taskData, error: taskError }: { data: unknown; error: unknown }) => {
  if (taskError) return;
  const { locations } = taskData as { locations: Location.LocationObject[] };
  if (!locations?.length) return;

  const latest = locations[locations.length - 1];
  const accuracy = getAccuracyForSpeed(latest.coords.speed);
  const { latitude, longitude } = latest.coords;

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
    await enqueueOfflineLocation(batch);
  }

  checkGeofence(latitude, longitude);
});

async function enqueueOfflineLocation(locations: Array<{ lat: number; lng: number; accuracy?: number; speed?: number; timestamp: number }>) {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const raw = await AsyncStorage.getItem(OFFLINE_LOCATIONS_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    existing.push(...locations);
    const keep = existing.slice(-50);
    await AsyncStorage.setItem(OFFLINE_LOCATIONS_KEY, JSON.stringify(keep));
  } catch {}
}

export async function startLocationTracking() {
  if (isTracking) return;
  isTracking = true;

  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 12000,
    distanceInterval: 15,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Kurir Rumah Keripik',
      notificationBody: 'Melacak lokasi pengiriman...',
      notificationColor: '#c55a2b',
    },
    pausesUpdatesAutomatically: true,
    activityType: Location.ActivityType.AutomotiveNavigation,
  });
}

export async function stopLocationTracking() {
  isTracking = false;
  await Location.stopLocationUpdatesAsync(LOCATION_TASK);
}

export async function flushOfflineLocations() {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const raw = await AsyncStorage.getItem(OFFLINE_LOCATIONS_KEY);
    if (!raw) return;
    const locations = JSON.parse(raw);
    if (locations.length === 0) return;

    await sendLocationBatch(locations);
    await AsyncStorage.removeItem(OFFLINE_LOCATIONS_KEY);
  } catch {}
}
