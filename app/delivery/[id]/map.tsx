import { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, Linking, Alert } from 'react-native';
import { router, useLocalSearchParams, Stack, useFocusEffect } from 'expo-router';
import MapView, { Polyline, Marker, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Navigation, ArrowLeft, MapPin, RotateCw } from 'lucide-react-native';

import { useAppColors, spacing, borderRadius } from '../../../src/theme';
import { getTodayRoute } from '../../../src/lib/api-client';
import { getCurrentLocation } from '../../../src/lib/location';
import { GlassBottomSheet } from '../../../src/components/ui/GlassBottomSheet';
import { t } from '../../../src/i18n';
import type { Waypoint } from '../../../src/lib/types';

const GUDANG_LAT = -5.1340;
const GUDANG_LNG = 119.4135;

export default function MapScreen() {
  const colors = useAppColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const mapRef = useRef<MapView>(null);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [multiRouteCoords, setMultiRouteCoords] = useState<Array<Array<{ latitude: number; longitude: number }>>>([]);
  const [allStops, setAllStops] = useState<Waypoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  useFocusEffect(
    useCallback(() => {
      init();
    }, [id])
  );

  async function init() {
    setError(null);
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
          } catch {
            console.warn(`OSRM segment ${i} failed, skipping`);
          }
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
        } catch {
          console.warn('OSRM single route failed');
        }
      }
    } catch (e) {
      console.error('loadRouteData failed:', e);
      setError('Gagal memuat rute. Periksa koneksi Anda.');
    }
  }

  function handleRetry() {
    setRetrying(true);
    setLoading(true);
    init().finally(() => {
      setRetrying(false);
    });
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: t('map.routeTitle'),
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
          }}
        />
        <View style={styles.errorContainer}>
          <MapPin size={48} color={colors.textMuted} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>{error}</Text>
          <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
            Pastikan koneksi internet stabil dan coba lagi
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.accent }]}
            onPress={handleRetry}
            disabled={retrying}
          >
            {retrying ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <RotateCw size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.retryBtnText}>Coba Lagi</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('map.routeTitle'),
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {currentLocation && (
          <Marker coordinate={currentLocation} title={t('map.myLocation')} pinColor="#2563eb" />
        )}
        {allStops.map((stop, index) => (
          <Marker
            key={`stop-${index}`}
            coordinate={{ latitude: stop.lat, longitude: stop.lng }}
            title={`${index + 1}. ${stop.name}`}
            description={t('map.stopNumber', { number: index + 1 })}
          >
            <View style={[styles.markerNumber, { backgroundColor: colors.accent }]}>
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

      <GlassBottomSheet snapPoints={[200, 320]} title={t('map.routeStops', { count: allStops.length })}>
        {allStops.map((stop, index) => (
          <View key={index} style={styles.stopItem}>
            <View style={[styles.stopNumber, { backgroundColor: colors.accent }]}>
              <Text style={styles.stopNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.stopInfo}>
              <Text style={[styles.stopName, { color: colors.text }]} numberOfLines={1}>{stop.name}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity style={[styles.navButton, { backgroundColor: colors.accent }]} onPress={openExternalMaps}>
          <Navigation size={16} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.navButtonText}>{t('map.openInMaps', { count: allStops.length })}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={16} color={colors.accent} style={{ marginRight: 6 }} />
          <Text style={[styles.backButtonText, { color: colors.accent }]}>{t('common.back')}</Text>
        </TouchableOpacity>
      </GlassBottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  stopListTitle: { fontSize: 14, fontWeight: '700', marginBottom: spacing.sm },
  stopItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  stopNumber: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm,
  },
  stopNumberText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  stopInfo: { flex: 1 },
  stopName: { fontSize: 13 },
  navButton: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    padding: spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  navButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  backButtonText: { fontSize: 14 },
  markerNumber: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff',
  },
  markerNumberText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    minHeight: 48,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
