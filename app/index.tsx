import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert, Platform } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../src/theme';
import { getTodayDeliveries, getProfile } from '../src/lib/api-client';
import { getCourierData, removeToken } from '../src/lib/storage';
import { startLocationTracking, stopLocationTracking } from '../src/lib/location';
import { registerForPushNotifications, setupNotificationListener } from '../src/lib/notifications';
import OfflineBanner, { useOnlineStatus } from '../src/components/OfflineBanner';
import type { CourierDeliveryDto, CourierDto } from '../src/lib/types';

export default function DashboardScreen() {
  const [courier, setCourier] = useState<CourierDto | null>(null);
  const [deliveries, setDeliveries] = useState<CourierDeliveryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    initSession();
    const unsub = setupNotificationListener((data) => {
      if (data.type === 'new_delivery' && data.id_transaksi) {
        getTodayDeliveries().then((fresh) => {
          const match = fresh.deliveries.find((d) => d.id_transaksi === data.id_transaksi);
          if (match) {
            router.push(`/delivery/${match.id}`);
          } else {
            loadDeliveries();
          }
        }).catch(() => loadDeliveries());
      }
    });
    return () => unsub();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDeliveries();
    }, [])
  );

  async function initSession() {
    const cached = await getCourierData<CourierDto>();
    if (cached) setCourier(cached);

    let currentCourier: CourierDto | null = cached;
    try {
      const data = await getProfile();
      currentCourier = data.courier;
      setCourier(data.courier);
    } catch {
      router.replace('/login');
      return;
    }

    setLoading(true);
    await loadDeliveries();

    if (currentCourier) {
      registerForPushNotifications(currentCourier.id);
    }
  }

  async function loadDeliveries() {
    try {
      const data = await getTodayDeliveries();
      setDeliveries(data.deliveries);
    } catch (error: unknown) {
      if (error instanceof Error && (error.message === 'NO_TOKEN' || error.message === 'UNAUTHORIZED')) {
        router.replace('/login');
      }
    }
    setLoading(false);
    setRefreshing(false);
  }

  async function toggleTracking() {
    if (tracking) {
      await stopLocationTracking();
      setTracking(false);
    } else {
      await startLocationTracking();
      setTracking(true);
    }
  }

  async function handleLogout() {
    Alert.alert('Logout', 'Yakin ingin logout?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await stopLocationTracking();
          await removeToken();
          router.replace('/login');
        },
      },
    ]);
  }

  const pendingDeliveries = deliveries.filter((d) => d.status === 'Siap_Dikirim' || d.status === 'Dalam_Pengiriman');
  const completedDeliveries = deliveries.filter((d) => d.status === 'Terkirim');
  const failedDeliveries = deliveries.filter((d) => d.status === 'Gagal');

  function getStatusLabel(status: string) {
    switch (status) {
      case 'Siap_Dikirim': return { label: 'Siap Diambil', color: colors.accent };
      case 'Dalam_Pengiriman': return { label: 'Dalam Perjalanan', color: '#2563eb' };
      case 'Terkirim': return { label: 'Terkirim', color: colors.green };
      case 'Gagal': return { label: 'Gagal', color: colors.error };
      default: return { label: status, color: colors.textMuted };
    }
  }

  function goToDetail(delivery: CourierDeliveryDto) {
    router.push(`/delivery/${delivery.id}`);
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
        <View>
          <Text style={styles.headerTitle}>Halo, {courier?.name || 'Kurir'}</Text>
          <Text style={styles.headerSub}>{deliveries.length} kiriman hari ini</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <View style={[styles.statCard, { borderLeftColor: colors.accent }]}>
          <Text style={styles.statNumber}>{pendingDeliveries.length}</Text>
          <Text style={styles.statLabel}>Tertunda</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: colors.green }]}>
          <Text style={styles.statNumber}>{completedDeliveries.length}</Text>
          <Text style={styles.statLabel}>Terkirim</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: colors.error }]}>
          <Text style={styles.statNumber}>{failedDeliveries.length}</Text>
          <Text style={styles.statLabel}>Gagal</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.trackingButton} onPress={toggleTracking}>
        <Text style={styles.trackingText}>
          {tracking ? '⏹ Stop Lacak Lokasi' : '▶ Mulai Lacak Lokasi'}
        </Text>
      </TouchableOpacity>

      <View style={styles.navRow}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/earnings')}>
          <Text style={styles.navBtnText}>💰 Pendapatan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtnSos} onPress={() => router.push('/sos')}>
          <Text style={styles.navBtnTextSos}>🆘 Darurat</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={deliveries}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDeliveries(); }} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Belum ada kiriman untuk hari ini</Text>
        }
        renderItem={({ item }) => {
          const status = getStatusLabel(item.status);
          return (
            <TouchableOpacity style={styles.card} onPress={() => goToDetail(item)}>
              <View style={styles.cardHeader}>
                <Text style={styles.orderCode}>{item.kode_pesanan}</Text>
                <View style={[styles.badge, { backgroundColor: status.color + '20' }]}>
                  <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>
              <Text style={styles.customerName}>{item.customer_name}</Text>
              <Text style={styles.address} numberOfLines={2}>{item.address}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.itemCount}>{item.items.length} item</Text>
                {item.distance_km && <Text style={styles.distance}>{item.distance_km} km</Text>}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  headerSub: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logout: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  trackingButton: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    backgroundColor: colors.accentLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  trackingText: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 14,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  orderCode: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  address: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemCount: {
    fontSize: 12,
    color: colors.textMuted,
  },
  distance: {
    fontSize: 12,
    color: colors.textMuted,
  },
  navRow: {
    flexDirection: 'row', paddingHorizontal: spacing.md, marginBottom: spacing.sm, gap: 8,
  },
  navBtn: {
    flex: 1, backgroundColor: '#fff', borderRadius: borderRadius.md, padding: spacing.md,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  navBtnSos: {
    flex: 1, backgroundColor: '#fef2f2', borderRadius: borderRadius.md, padding: spacing.md,
    alignItems: 'center', borderWidth: 1, borderColor: '#fecaca',
  },
  navBtnText: { fontSize: 14, fontWeight: '600', color: colors.text },
  navBtnTextSos: { fontSize: 14, fontWeight: '600', color: '#991b1b' },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 60,
    fontSize: 16,
  },
});
