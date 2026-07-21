import { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, Linking } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../../../src/theme';
import { getTodayRoute } from '../../../src/lib/api-client';
import { getCurrentLocation } from '../../../src/lib/location';
import type { Waypoint } from '../../../src/lib/types';

const GUDANG_LAT = -0.5022;
const GUDANG_LNG = 117.1536;

export default function MapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const mapRef = useRef<MapView>(null);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [destination, setDestination] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);
  const [useGoogleMaps, setUseGoogleMaps] = useState(false);

  useEffect(() => {
    init();
  }, [id]);

  async function init() {
    const loc = await getCurrentLocation();
    if (loc) {
      setCurrentLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    }

    try {
      const routeData = await getTodayRoute();
      setWaypoints(routeData.waypoints);

      const destWp = routeData.waypoints.find((wp) => wp.id_transaksi && String(wp.id_transaksi) === id);
      if (!destWp && routeData.waypoints.length > 1) {
        const lastDest = routeData.waypoints[routeData.waypoints.length - 1];
        setDestination({
          lat: lastDest.lat,
          lng: lastDest.lng,
          name: lastDest.name,
        });
        fetchRoute(
          loc ? { latitude: loc.coords.latitude, longitude: loc.coords.longitude } : { latitude: GUDANG_LAT, longitude: GUDANG_LNG },
          { latitude: lastDest.lat, longitude: lastDest.lng }
        );
      } else if (destWp) {
        setDestination({
          lat: destWp.lat,
          lng: destWp.lng,
          name: destWp.name,
        });
        fetchRoute(
          loc ? { latitude: loc.coords.latitude, longitude: loc.coords.longitude } : { latitude: GUDANG_LAT, longitude: GUDANG_LNG },
          { latitude: destWp.lat, longitude: destWp.lng }
        );
      }
    } catch {
      // fallback: no route data
    }
    setLoading(false);
  }

  async function fetchRoute(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }) {
    setRouteLoading(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.routes?.length) {
        const coords = json.routes[0].geometry.coordinates.map(
          (c: number[]) => ({ latitude: c[1], longitude: c[0] })
        );
        setRouteCoords(coords);
      }
    } catch {
      // OSRM failed — user can open Google Maps instead
      setUseGoogleMaps(true);
    }
    setRouteLoading(false);
  }

  function openExternalMaps() {
    if (!destination) return;
    const from = currentLocation
      ? `${currentLocation.latitude},${currentLocation.longitude}`
      : `${GUDANG_LAT},${GUDANG_LNG}`;
    const to = `${destination.lat},${destination.lng}`;
    const url = Platform.OS === 'ios'
      ? `https://maps.apple.com/?daddr=${destination.lat},${destination.lng}&saddr=${from}`
      : `https://www.google.com/maps/dir/?api=1&origin=${from}&destination=${to}&travelmode=driving`;
    Linking.openURL(url);
  }

  const initialRegion: Region = {
    latitude: currentLocation?.latitude || GUDANG_LAT,
    longitude: currentLocation?.longitude || GUDANG_LNG,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.accent} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: 'Rute Pengiriman' }} />

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {(currentLocation || destination) && (
          <>
            {currentLocation && (
              <Marker coordinate={currentLocation} title="Posisi Saya" pinColor="#2563eb" />
            )}
            {destination && (
              <Marker
                coordinate={{ latitude: destination.lat, longitude: destination.lng }}
                title={destination.name}
                pinColor={colors.accent}
              />
            )}
            {routeCoords.length > 0 && (
              <Polyline
                coordinates={routeCoords}
                strokeColor={colors.accent}
                strokeWidth={4}
                lineCap="round"
                lineJoin="round"
              />
            )}
          </>
        )}
      </MapView>

      <View style={styles.bottomSheet}>
        {destination && (
          <View style={styles.info}>
            <Text style={styles.infoTitle}>Tujuan: {destination.name}</Text>
            {routeLoading && <Text style={styles.infoSub}>Memuat rute...</Text>}
          </View>
        )}
        <TouchableOpacity style={styles.navButton} onPress={openExternalMaps}>
          <Text style={styles.navButtonText}>🗺️ Buka di Google Maps</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Kembali</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  map: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  info: {
    marginBottom: spacing.md,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  infoSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  navButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    padding: spacing.md + 2,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  navButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  backButtonText: {
    color: colors.accent,
    fontSize: 14,
  },
});
