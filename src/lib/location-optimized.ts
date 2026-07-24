import * as Location from 'expo-location';

let lastSpeed = 0;

export function getAccuracyForSpeed(speed: number | null): Location.LocationAccuracy {
  const s = speed ?? 0;
  lastSpeed = s;
  if (s > 5) return Location.Accuracy.BestForNavigation;
  if (s > 1) return Location.Accuracy.Balanced;
  return Location.Accuracy.Low;
}

export async function startAdaptiveTracking() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return;
  await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.Balanced, timeInterval: 12000, distanceInterval: 20 },
    () => {}
  );
}

export async function stopAdaptiveTracking() {
  await Location.stopLocationUpdatesAsync('background-location-adaptive');
}
