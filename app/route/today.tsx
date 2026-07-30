import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  MapPin,
  RotateCw,
  Navigation,
  Compass,
  ExternalLink,
  Layers,
  ChevronRight,

} from 'lucide-react-native';

import { useAppColors, spacing, borderRadius } from '../../src/theme';
import { getTodayRoute } from '../../src/lib/api-client';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GlassBottomSheet } from '../../src/components/ui/GlassBottomSheet';
import OfflineBanner from '../../src/components/OfflineBanner';

interface RouteStop {
  lat: number;
  lng: number;
  name: string;
  type: 'start' | 'destination' | 'current';
  id_transaksi?: string;
  sequence_no?: number;
}

export default function RouteTodayScreen() {
  const colors = useAppColors();
  const sheetRef = useRef<any>(null);
  const [waypoints, setWaypoints] = useState<RouteStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalDeliveries, setTotalDeliveries] = useState(0);
  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null);

  async function loadRoute() {
    try {
      const data = await getTodayRoute();
      setWaypoints(data.waypoints || []);
      setTotalDeliveries(data.total_deliveries || 0);
    } catch (e) {
      console.error('loadRoute failed:', e);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
      }
      setWaypoints([]);
    }
    setLoading(false);
    setRefreshing(false);
  }

  useFocusEffect(
    useCallback(() => {
      loadRoute();
    }, [])
  );

  const destinations = waypoints.filter((w) => w.type === 'destination');

  function openInGoogleMaps(stop: RouteStop) {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => undefined);
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}`;
    Linking.openURL(url);
  }

  function openInWaze(stop: RouteStop) {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => undefined);
    }
    const url = `https://waze.com/ul?ll=${stop.lat},${stop.lng}&navigate=yes`;
    Linking.openURL(url);
  }

  function openMultiStopRoute() {
    if (destinations.length === 0) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    }
    const dest = destinations[destinations.length - 1];
    const waypointsParam = destinations
      .slice(0, -1)
      .map((d) => `${d.lat},${d.lng}`)
      .join('|');

    const url = `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}${
      waypointsParam ? `&waypoints=${waypointsParam}` : ''
    }`;
    Linking.openURL(url);
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <OfflineBanner />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color={colors.accent} style={{ marginRight: 4 }} />
          <Text style={[styles.back, { color: colors.accent }]}>Kembali</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Rute Multistop Hari Ini</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Summary Card — GlassCard */}
      <GlassCard style={styles.summaryCard}>
        <View style={styles.summaryTopRow}>
          <Compass size={24} color={colors.accent} />
          <Text style={[styles.summaryNumber, { color: colors.accent }]}>
            {totalDeliveries}
          </Text>
        </View>
        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
          Total Titik Tujuan Pengiriman
        </Text>

        <Text style={[styles.summaryKm, { color: colors.textMuted }]}>
          {waypoints.length > 1
            ? `${Math.round(
                waypoints.slice(0, -1).reduce((sum, wp, i) => {
                  const R = 6371;
                  const dLat = ((waypoints[i + 1].lat - wp.lat) * Math.PI) / 180;
                  const dLng = ((waypoints[i + 1].lng - wp.lng) * Math.PI) / 180;
                  const a =
                    Math.sin(dLat / 2) ** 2 +
                    Math.cos((wp.lat * Math.PI) / 180) *
                      Math.cos((waypoints[i + 1].lat * Math.PI) / 180) *
                      Math.sin(dLng / 2) ** 2;
                  return sum + R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                }, 0)
              )} km estimasi total jarak`
            : ''}
        </Text>
      </GlassCard>

      {/* Action Row: Re-Optimize & Multi-Stop Open */}
      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            { backgroundColor: colors.accentLight, borderColor: colors.accent },
          ]}
          onPress={async () => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
            }
            try {
              const token = await (await import('../../src/lib/storage')).getToken();
              const res = await fetch('https://rumah-keripik.vercel.app/api/courier/route/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
                body: JSON.stringify({}),
              });
              const json = await res.json();
              if (json.ok) {
                Alert.alert('Optimasi Berhasil', 'Rute telah dioptimasi ulang.');
              } else {
                Alert.alert('Optimasi Gagal', json.error || 'Coba lagi nanti');
              }
            } catch {
              Alert.alert('Gagal', 'Tidak dapat mengoptimasi rute, cek koneksi Anda');
            }
            loadRoute();
          }}
          activeOpacity={0.8}
        >
          <RotateCw size={16} color={colors.accent} style={{ marginRight: 6 }} />
          <Text style={[styles.actionBtnText, { color: colors.accent }]}>
            Optimasi Rute Ulang
          </Text>
        </TouchableOpacity>

        {destinations.length > 0 && (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: colors.greenLight, borderColor: colors.green },
            ]}
            onPress={openMultiStopRoute}
            activeOpacity={0.8}
          >
            <ExternalLink size={16} color={colors.green} style={{ marginRight: 6 }} />
            <Text style={[styles.actionBtnText, { color: colors.green }]}>
              Google Maps All-Stops
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Waypoints Destinations List */}
      <FlashList
        data={destinations}
        keyExtractor={(item, i) => item.id_transaksi || String(i)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadRoute();
            }}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Layers size={48} color={colors.textMuted} />
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              Belum ada rute pengiriman untuk hari ini
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const prevStop = index > 0 ? destinations[index - 1] : waypoints[0];
          const prevLat = prevStop?.lat;
          const prevLng = prevStop?.lng;
          const R = 6371;
          const dLat = ((item.lat - prevLat) * Math.PI) / 180;
          const dLng = ((item.lng - prevLng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((prevLat * Math.PI) / 180) *
              Math.cos((item.lat * Math.PI) / 180) *
              Math.sin(dLng / 2) ** 2;
          const distKm = prevLat
            ? Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10
            : 0;

          return (
            <TouchableOpacity
              onPress={() => {
                setSelectedStop(item);
                sheetRef.current?.snapToIndex(1);
              }}
              activeOpacity={0.85}
            >
              <GlassCard noPadding>
                <View style={styles.stopCardInner}>
                  <View style={styles.stopHeader}>
                    <View
                      style={[
                        styles.stopNumber,
                        { backgroundColor: colors.accent },
                      ]}
                    >
                      <Text style={styles.stopNumberText}>#{index + 1}</Text>
                    </View>

                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text style={[styles.stopName, { color: colors.text }]} numberOfLines={1}>
                        {item.name || `Tujuan #${index + 1}`}
                      </Text>
                      {item.id_transaksi && (
                        <Text style={[styles.stopId, { color: colors.textMuted }]}>
                          Resi: #{item.id_transaksi.slice(0, 10)}
                        </Text>
                      )}
                    </View>

                    <View style={styles.directNavButtons}>
                      <TouchableOpacity
                        style={[styles.smallNavBtn, { backgroundColor: colors.accentLight }]}
                        onPress={() => openInGoogleMaps(item)}
                        activeOpacity={0.7}
                        aria-label="Google Maps"
                      >
                        <Navigation size={15} color={colors.accent} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.smallNavBtn, { backgroundColor: colors.greenLight }]}
                        onPress={() => openInWaze(item)}
                        activeOpacity={0.7}
                        aria-label="Waze"
                      >
                        <ExternalLink size={15} color={colors.green} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.distanceFooter}>
                    <MapPin size={13} color={colors.textMuted} style={{ marginRight: 4 }} />
                    <Text style={[styles.distance, { color: colors.textMuted }]}>
                      {distKm > 0 ? `${distKm} km dari titik sebelumnya` : 'Titik Awal Gudang'}
                    </Text>
                    <ChevronRight size={14} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>
          );
        }}
      />

      {/* Glass Bottom Sheet — Interactive Detail Panel */}
      <GlassBottomSheet snapPoints={['20%', '55%', '90%']} title={selectedStop?.name}>
        {selectedStop && (
          <>
            <View style={styles.sheetHeader}>
              <View style={[styles.sheetNumberBadge, { backgroundColor: colors.accent }]}>
                <Text style={styles.sheetNumberText}>
                  #{destinations.findIndex(d => d.lat === selectedStop.lat && d.lng === selectedStop.lng) + 1}
                </Text>
              </View>
              <Text style={[styles.sheetTitle, { color: colors.text }]} numberOfLines={1}>
                {selectedStop.name || 'Tujuan'}
              </Text>
            </View>

            {selectedStop.id_transaksi && (
              <Text style={[styles.sheetResi, { color: colors.textMuted }]}>
                Resi: #{selectedStop.id_transaksi}
              </Text>
            )}

            <View style={styles.sheetActionRow}>
              <TouchableOpacity
                style={[styles.sheetActionBtn, { backgroundColor: colors.info }]}
                onPress={() => openInGoogleMaps(selectedStop)}
                activeOpacity={0.8}
              >
                <Navigation size={18} color="#fff" />
                <Text style={styles.sheetActionText}>Google Maps</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sheetActionBtn, { backgroundColor: colors.green }]}
                onPress={() => openInWaze(selectedStop)}
                activeOpacity={0.8}
              >
                <ExternalLink size={18} color="#fff" />
                <Text style={styles.sheetActionText}>Waze</Text>
              </TouchableOpacity>
            </View>

            {selectedStop.id_transaksi && (
              <TouchableOpacity
                style={[styles.sheetDetailBtn, { borderColor: colors.border }]}
                onPress={() => router.push(`/delivery/${selectedStop.id_transaksi!.split('-')[1]}`)}
                activeOpacity={0.8}
              >
                <ChevronRight size={16} color={colors.accent} />
                <Text style={[styles.sheetDetailText, { color: colors.accent }]}>
                  Lihat Detail Pengiriman
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </GlassBottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingRight: 10,
  },
  back: {
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  summaryCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryNumber: {
    fontSize: 36,
    fontWeight: '800',
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  summaryKm: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: 48,
  },
  actionBtnText: {
    fontWeight: '700',
    fontSize: 12,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  stopCardInner: {
    padding: spacing.lg,
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopNumberText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  stopName: {
    fontSize: 15,
    fontWeight: '700',
  },
  stopId: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  directNavButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  smallNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  distance: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  empty: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '500',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sheetNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetNumberText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  sheetResi: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: spacing.md,
  },
  sheetActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  sheetActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  sheetActionText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  sheetDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  sheetDetailText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
