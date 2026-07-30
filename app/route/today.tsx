import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert, Linking } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../../src/theme';
import { getTodayRoute } from '../../src/lib/api-client';
import OfflineBanner from '../../src/components/OfflineBanner';
import StatusBadge from '../../src/components/ui/StatusBadge';

interface RouteStop {
  lat: number;
  lng: number;
  name: string;
  type: 'start' | 'destination' | 'current';
  id_transaksi?: string;
  sequence_no?: number;
}

export default function RouteTodayScreen() {
  const [waypoints, setWaypoints] = useState<RouteStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalDeliveries, setTotalDeliveries] = useState(0);

  async function loadRoute() {
    try {
      const data = await getTodayRoute();
      setWaypoints(data.waypoints);
      setTotalDeliveries(data.total_deliveries);
    } catch {
      setWaypoints([]);
    }
    setLoading(false);
    setRefreshing(false);
  }

  useFocusEffect(useCallback(() => { loadRoute(); }, []));

  const destinations = waypoints.filter(w => w.type === 'destination');

  function openInMaps(stop: RouteStop) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}`;
    Linking.openURL(url);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.accent} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <OfflineBanner />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rute Hari Ini</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryNumber}>{totalDeliveries}</Text>
        <Text style={styles.summaryLabel}>total tujuan</Text>
        <Text style={styles.summaryKm}>
          {waypoints.length > 1
            ? `${Math.round(
                waypoints.slice(0, -1).reduce((sum, wp, i) => {
                  const R = 6371; const dLat = (waypoints[i+1].lat - wp.lat) * Math.PI / 180;
                  const dLng = (waypoints[i+1].lng - wp.lng) * Math.PI / 180;
                  const a = Math.sin(dLat/2)**2 + Math.cos(wp.lat * Math.PI/180) * Math.cos(waypoints[i+1].lat * Math.PI/180) * Math.sin(dLng/2)**2;
                  return sum + R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                }, 0)
              )} km estimasi`
            : ''}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.optimizeBtn}
        onPress={() => {
          Alert.alert('Optimasi Rute', 'Mengoptimasi ulang urutan pengiriman...', [{ text: 'OK' }]);
          loadRoute();
        }}
      >
        <Text style={styles.optimizeBtnText}>🔄 Optimasi Rute Ulang</Text>
      </TouchableOpacity>

      <FlatList
        data={destinations}
        keyExtractor={(item, i) => item.id_transaksi || String(i)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadRoute(); }} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Belum ada rute untuk hari ini</Text>
        }
        renderItem={({ item, index }) => {
          const prevStop = index > 0 ? destinations[index - 1] : waypoints[0];
          const prevLat = prevStop?.lat;
          const prevLng = prevStop?.lng;
          const R = 6371;
          const dLat = (item.lat - prevLat) * Math.PI / 180;
          const dLng = (item.lng - prevLng) * Math.PI / 180;
          const a = Math.sin(dLat/2)**2 + Math.cos(prevLat * Math.PI/180) * Math.cos(item.lat * Math.PI/180) * Math.sin(dLng/2)**2;
          const distKm = prevLat ? Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 10) / 10 : 0;

          return (
            <TouchableOpacity
              style={styles.stopCard}
              onPress={() => {
                if (item.id_transaksi) {
                  router.push(`/delivery/${item.id_transaksi.split('-')[0]}`);
                } else {
                  openInMaps(item);
                }
              }}
            >
              <View style={styles.stopHeader}>
                <View style={styles.stopNumber}>
                  <Text style={styles.stopNumberText}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.stopName} numberOfLines={1}>{item.name || `Tujuan ${index + 1}`}</Text>
                  {item.id_transaksi && <Text style={styles.stopId}>#{item.id_transaksi.slice(0, 8)}</Text>}
                </View>
                <TouchableOpacity style={styles.navBtn} onPress={() => openInMaps(item)}>
                  <Text style={styles.navBtnText}>🗺</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.distance}>{distKm > 0 ? `${distKm} km dari tujuan sebelumnya` : 'Titik awal (Gudang)'}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  back: { fontSize: 14, color: colors.accent, fontWeight: '600' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  summary: {
    alignItems: 'center', paddingVertical: spacing.lg,
    backgroundColor: colors.surface, marginHorizontal: spacing.xl,
    borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md,
  },
  summaryNumber: { fontSize: 40, fontWeight: '800', color: colors.accent },
  summaryLabel: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  summaryKm: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  optimizeBtn: {
    marginHorizontal: spacing.xl, marginBottom: spacing.md,
    backgroundColor: colors.accentLight, borderRadius: borderRadius.md,
    padding: spacing.md, alignItems: 'center',
  },
  optimizeBtnText: { color: colors.accent, fontWeight: '600', fontSize: 14 },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  stopCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.lg, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  stopHeader: { flexDirection: 'row', alignItems: 'center' },
  stopNumber: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  stopNumberText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  stopName: { fontSize: 15, fontWeight: '600', color: colors.text },
  stopId: { fontSize: 11, color: colors.textMuted, fontFamily: 'monospace' },
  distance: { fontSize: 12, color: colors.textMuted, marginTop: 6, marginLeft: 44 },
  navBtn: {
    padding: spacing.sm, borderRadius: borderRadius.full,
    backgroundColor: '#f0f5ff',
  },
  navBtnText: { fontSize: 18 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 60, fontSize: 16 },
});
