import { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, Linking } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../../../src/theme';
import { getTodayRoute } from '../../../src/lib/api-client';
import { getCurrentLocation } from '../../../src/lib/location';
import type { Waypoint } from '../../../src/lib/types';

const GUDANG_LAT = -5.1340;
const GUDANG_LNG = 119.4135;

export default function MapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const mapRef = useRef<MapView>(null);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [multiRouteCoords, setMultiRouteCoords] = useState<Array<Array<{ latitude: number; longitude: number }>>>([]);
  const [allStops, setAllStops] = useState<Waypoint[]>([]);

  useEffect(() => {
    init();
  }, [id]);

  async function init() {
    const loc = await getCurrentLocation();
    let coords: { latitude: number; longitude: number } | null = null;
    if (loc) {
      coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setCurrentLocation(coords);
    }

    await loadRouteData(coords);
    setLoading(false);
  }

  async function loadRouteData(loc: { latitude: number; longitude: number } | null) {
    try {
      const routeData = await getTodayRoute();
      setWaypoints(routeData.waypoints);

      const dests = routeData.waypoints.filter((wp) => wp.type === 'destination');
      const sorted = [...dests].sort((a, b) => (a.sequence_no ?? 99) - (b.sequence_no ?? 99));
      setAllStops(sorted);

      if (dests.length > 1) {
        const origin = loc ? { latitude: loc.latitude, longitude: loc.longitude } : { latitude: GUDANG_LAT, longitude: GUDANG_LNG };
        const allPoints = [origin, ...sorted.map((d) => ({ latitude: d.lat, longitude: d.lng }))];

        const segmentCoords: Array<Array<{ latitude: number; longitude: number }>> = [];
        for (let i = 0; i < allPoints.length - 1; i++) {
          try {
            const url = `https://router.project-osrm.org/route/v1/driving/${allPoints[i].longitude},${allPoints[i].latitude};${allPoints[i + 1].longitude},${allPoints[i + 1].latitude}?overview=full&geometries=geojson`;
            const res = await fetch(url);
            const json = await res.json();
            if (json.routes?.length) {
              const coords = json.routes[0].geometry.coordinates.map(
                (c: number[]) => ({ latitude: c[1], longitude: c[0] })
              );
              segmentCoords.push(coords);
            }
          } catch {}
        }
        setMultiRouteCoords(segmentCoords);

        const fullCoords = segmentCoords.flat();
        setRouteCoords(fullCoords);
      } else if (dests.length === 1) {
        const dest = dests[0];
        const origin = loc ? { latitude: loc.latitude, longitude: loc.longitude } : { latitude: GUDANG_LAT, longitude: GUDANG_LNG };
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          const json = await res.json();
          if (json.routes?.length) {
            const coords = json.routes[0].geometry.coordinates.map(
              (c: number[]) => ({ latitude: c[1], longitude: c[0] })
            );
            setRouteCoords(coords);
            setMultiRouteCoords([coords]);
          }
        } catch {}
      }
    } catch {}
  }

  function openExternalMaps() {
    if (allStops.length === 0) return;
    const from = currentLocation
      ? `${currentLocation.latitude},${currentLocation.longitude}`
      : `${GUDANG_LAT},${GUDANG_LNG}`;
    const stops = allStops.map((s) => `${s.lat},${s.lng}`);
    const stopsParam = stops.slice(0, -1).join('|');
    const to = `${allStops[allStops.length - 1].lat},${allStops[allStops.length - 1].lng}`;
    const url = Platform.OS === 'ios'
      ? `https://maps.apple.com/?daddr=${to}&saddr=${from}`
      : `https://www.google.com/maps/dir/?api=1&origin=${from}&destination=${to}&travelmode=driving&waypoints=${stopsParam}`;
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
        {currentLocation && (
          <Marker coordinate={currentLocation} title="Posisi Saya" pinColor="#2563eb" />
        )}
        {allStops.map((stop, index) => (
          <Marker
            key={`stop-${index}`}
            coordinate={{ latitude: stop.lat, longitude: stop.lng }}
            title={`${index + 1}. ${stop.name}`}
            description={`Stop ke-${index + 1}`}
            pinColor={colors.accent}
          >
            <View style={styles.markerNumber}>
              <Text style={styles.markerNumberText}>{index + 1}</Text>
            </View>
          </Marker>
        ))}
        {multiRouteCoords.map((coords, idx) => (
          coords.length > 0 && (
            <Polyline
              key={`route-${idx}`}
              coordinates={coords}
              strokeColor={idx === 0 ? colors.accent : '#8B5CF6'}
              strokeWidth={idx === 0 ? 4 : 3}
              lineCap="round"
              lineJoin="round"
            />
          )
        ))}
      </MapView>

      <View style={styles.bottomSheet}>
        <View style={styles.stopList}>
          <Text style={styles.stopListTitle}>Rute Pengiriman ({allStops.length} stop)</Text>
          {allStops.map((stop, index) => (
            <View key={index} style={styles.stopItem}>
              <View style={styles.stopNumber}>
                <Text style={styles.stopNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.stopInfo}>
                <Text style={styles.stopName} numberOfLines={1}>{stop.name}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.navButton} onPress={openExternalMaps}>
          <Text style={styles.navButtonText}>🗺️ Buka di Google Maps ({allStops.length} stop)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Kembali</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  map: { flex: 1 },
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
    maxHeight: 280,
  },
  stopList: { marginBottom: spacing.md },
  stopListTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  stopItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  stopNumber: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm,
  },
  stopNumberText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  stopInfo: { flex: 1 },
  stopName: { fontSize: 13, color: colors.text },
  navButton: {
    backgroundColor: colors.accent, borderRadius: borderRadius.md,
    padding: spacing.md + 2, alignItems: 'center', marginBottom: spacing.md,
  },
  navButtonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  backButton: { alignItems: 'center', paddingVertical: spacing.sm },
  backButtonText: { color: colors.accent, fontSize: 14 },
  markerNumber: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff',
  },
  markerNumberText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});