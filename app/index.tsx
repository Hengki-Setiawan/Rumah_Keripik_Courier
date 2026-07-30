import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  LogOut,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  Wallet,
  ShieldAlert,
  Bell,
  AlertTriangle,
  History,
  MapPin,
  PackageCheck,
  Navigation,
  Compass,
  Check,
  X,
  ChevronRight,
} from 'lucide-react-native';

import { useAppColors, spacing, borderRadius } from '../src/theme';
import { getTodayDeliveries, getProfile, respondToOffer } from '../src/lib/api-client';
import { getCourierData, removeToken } from '../src/lib/storage';
import { startLocationTracking, stopLocationTracking } from '../src/lib/location';
import { registerForPushNotifications, setupNotificationListener } from '../src/lib/notifications';
import OfflineBanner from '../src/components/OfflineBanner';
import type { CourierDeliveryDto, CourierDto } from '../src/lib/types';

export default function DashboardScreen() {
  const colors = useAppColors();
  const [courier, setCourier] = useState<CourierDto | null>(null);
  const [deliveries, setDeliveries] = useState<CourierDeliveryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [respondedIds, setRespondedIds] = useState<number[]>([]);

  useEffect(() => {
    initSession();
    const unsub = setupNotificationListener((data) => {
      if (data.type === 'new_delivery' && data.id_transaksi) {
        getTodayDeliveries()
          .then((fresh) => {
            const match = fresh.deliveries.find((d) => d.id_transaksi === data.id_transaksi);
            if (match) {
              router.push(`/delivery/${match.id}`);
            } else {
              loadDeliveries();
            }
          })
          .catch(() => loadDeliveries());
      } else if (data.type === 'order_update' || data.type === 'route_update') {
        loadDeliveries();
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
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    }
    if (tracking) {
      await stopLocationTracking();
      setTracking(false);
    } else {
      await startLocationTracking();
      setTracking(true);
    }
  }

  async function handleLogout() {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
    Alert.alert('Konfirmasi Logout', 'Apakah Anda yakin ingin keluar dari akun kurir?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await stopLocationTracking();
          await removeToken();
          router.replace('/login');
        },
      },
    ]);
  }

  const offers = deliveries.filter((d) => d.status === 'Siap_Dikirim' && !respondedIds.includes(d.id));
  const pendingDeliveries = deliveries.filter((d) => d.status === 'Dalam_Pengiriman');
  const completedDeliveries = deliveries.filter((d) => d.status === 'Terkirim');
  const failedDeliveries = deliveries.filter((d) => d.status === 'Gagal');
  const [timers, setTimers] = useState<Record<number, number>>({});
  const [responding, setResponding] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (offers.length === 0) {
      setTimers({});
      return;
    }
    const interval = setInterval(() => {
      for (const o of offers) {
        const createdAt = o.created_at || new Date().toISOString();
        const elapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
        const remaining = Math.max(0, 45 - elapsed);
        setTimers((prev) => ({ ...prev, [o.id]: remaining }));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [offers.length]);

  async function handleRespond(id: number, action: 'accept' | 'reject') {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    }
    setResponding((prev) => ({ ...prev, [id]: true }));
    try {
      await respondToOffer(id, action);
      setRespondedIds((prev) => [...prev, id]);
      loadDeliveries();
    } catch {
      Alert.alert('Gagal', 'Permintaan gagal diproses. Coba lagi.');
    }
    setResponding((prev) => ({ ...prev, [id]: false }));
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'Siap_Dikirim':
        return { label: 'Siap Diambil', color: colors.accent, bg: colors.accentLight };
      case 'Dalam_Pengiriman':
        return { label: 'Dalam Perjalanan', color: colors.info, bg: 'rgba(61,126,166,0.14)' };
      case 'Terkirim':
        return { label: 'Terkirim', color: colors.green, bg: colors.greenLight };
      case 'Gagal':
        return { label: 'Gagal', color: colors.error, bg: colors.errorBg };
      default:
        return { label: status, color: colors.textMuted, bg: colors.surfaceDark };
    }
  }

  function goToDetail(delivery: CourierDeliveryDto) {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => undefined);
    }
    router.push(`/delivery/${delivery.id}` as any);
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
        <View style={styles.headerLeft}>
          {courier?.photo_url ? (
            <Image source={{ uri: courier.photo_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.accentLight }]}>
              <Text style={[styles.avatarText, { color: colors.accent }]}>
                {courier?.name?.charAt(0)?.toUpperCase() || 'K'}
              </Text>
            </View>
          )}
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Halo, {courier?.name || 'Kurir'}
            </Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
              {deliveries.length} pengiriman hari ini
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          style={[styles.logoutBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <LogOut size={16} color={colors.error} />
        </TouchableOpacity>
      </View>

      {/* Stat Summary Cards */}
      <View style={styles.statsRow}>
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderLeftColor: colors.accent,
            },
          ]}
        >
          <View style={styles.statIconHeader}>
            <Truck size={16} color={colors.accent} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{pendingDeliveries.length}</Text>
          </View>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tertunda</Text>
        </View>

        <View
          style={[
            styles.statCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderLeftColor: colors.green,
            },
          ]}
        >
          <View style={styles.statIconHeader}>
            <CheckCircle2 size={16} color={colors.green} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{completedDeliveries.length}</Text>
          </View>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Terkirim</Text>
        </View>

        <View
          style={[
            styles.statCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderLeftColor: colors.error,
            },
          ]}
        >
          <View style={styles.statIconHeader}>
            <XCircle size={16} color={colors.error} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{failedDeliveries.length}</Text>
          </View>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Gagal</Text>
        </View>
      </View>

      {/* Tracking Toggle Bar */}
      <TouchableOpacity
        style={[
          styles.trackingButton,
          {
            backgroundColor: tracking ? colors.greenLight : colors.accentLight,
            borderColor: tracking ? colors.green : colors.accent,
          },
        ]}
        onPress={toggleTracking}
        activeOpacity={0.8}
      >
        <Compass size={18} color={tracking ? colors.green : colors.accent} style={{ marginRight: 8 }} />
        <Text style={[styles.trackingText, { color: tracking ? colors.green : colors.accent }]}>
          {tracking ? 'Lacak Lokasi Real-Time Aktif (Tap untuk Stop)' : 'Mulai Lacak Lokasi Real-Time'}
        </Text>
      </TouchableOpacity>

      {/* Quick Navigation Row 1 */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push('/route/today' as any)}
          activeOpacity={0.7}
        >
          <MapPin size={16} color={colors.accent} />
          <Text style={[styles.navBtnText, { color: colors.text }]}>Peta Rute</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push('/shift' as any)}
          activeOpacity={0.7}
        >
          <Clock size={16} color={colors.accent} />
          <Text style={[styles.navBtnText, { color: colors.text }]}>Shift</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push('/earnings')}
          activeOpacity={0.7}
        >
          <Wallet size={16} color={colors.green} />
          <Text style={[styles.navBtnText, { color: colors.text }]}>Pendapatan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtnSos, { backgroundColor: colors.errorBg, borderColor: colors.errorBorder }]}
          onPress={() => router.push('/sos')}
          activeOpacity={0.7}
        >
          <ShieldAlert size={16} color={colors.error} />
          <Text style={[styles.navBtnTextSos, { color: colors.error }]}>SOS</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Navigation Row 2 */}
      <View style={[styles.navRow, { marginTop: 0 }]}>
        <TouchableOpacity
          style={[styles.navBtnLight, { backgroundColor: colors.surfaceDark, borderColor: colors.border }]}
          onPress={() => router.push('/notifications' as any)}
          activeOpacity={0.7}
        >
          <Bell size={16} color={colors.textSecondary} />
          <Text style={[styles.navBtnText, { color: colors.text }]}>Notifikasi</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtnLight, { backgroundColor: colors.surfaceDark, borderColor: colors.border }]}
          onPress={() => router.push('/incidents' as any)}
          activeOpacity={0.7}
        >
          <AlertTriangle size={16} color={colors.warning} />
          <Text style={[styles.navBtnText, { color: colors.text }]}>Insiden</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtnLight, { backgroundColor: colors.surfaceDark, borderColor: colors.border }]}
          onPress={() => router.push('/history')}
          activeOpacity={0.7}
        >
          <History size={16} color={colors.textSecondary} />
          <Text style={[styles.navBtnText, { color: colors.text }]}>Riwayat</Text>
        </TouchableOpacity>
      </View>

      {/* New Delivery Offers Box */}
      {offers.length > 0 && (
        <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.md }}>
          <View style={styles.offerHeaderTitle}>
            <PackageCheck size={18} color={colors.accent} style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.accent }}>
              Tawaran Pesanan Baru ({offers.length})
            </Text>
          </View>
          {offers.map((offer) => {
            const remaining = timers[offer.id] ?? 45;
            return (
              <View
                key={offer.id}
                style={[
                  styles.offerCard,
                  {
                    borderColor: colors.accent,
                    backgroundColor: colors.accentLight,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.orderCode, { color: colors.textSecondary }]}>
                    {offer.kode_pesanan}
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '800',
                      color: remaining < 10 ? colors.error : colors.accent,
                    }}
                  >
                    {remaining}s
                  </Text>
                </View>
                <Text style={[styles.customerName, { color: colors.text }]}>
                  {offer.customer_name}
                </Text>
                <Text style={[styles.address, { color: colors.textSecondary }]} numberOfLines={2}>
                  {offer.address}
                </Text>
                <View style={styles.offerActionRow}>
                  <TouchableOpacity
                    style={[styles.acceptBtn, { backgroundColor: colors.green }]}
                    onPress={() => handleRespond(offer.id, 'accept')}
                    disabled={responding[offer.id]}
                    activeOpacity={0.8}
                  >
                    <Check size={16} color={colors.white} style={{ marginRight: 4 }} />
                    <Text style={styles.offerBtnText}>Terima</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rejectBtn, { backgroundColor: colors.error }]}
                    onPress={() => handleRespond(offer.id, 'reject')}
                    disabled={responding[offer.id]}
                    activeOpacity={0.8}
                  >
                    <X size={16} color={colors.white} style={{ marginRight: 4 }} />
                    <Text style={styles.offerBtnText}>Tolak</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Main Delivery List */}
      <FlatList
        data={deliveries.filter((d) => d.status !== 'Siap_Dikirim')}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadDeliveries();
            }}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <PackageCheck size={48} color={colors.textMuted} />
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              Belum ada tugas kiriman untuk hari ini
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const badge = getStatusBadge(item.status);
          return (
            <TouchableOpacity
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => goToDetail(item)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.orderCode, { color: colors.textSecondary }]}>
                  {item.kode_pesanan}
                </Text>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                </View>
              </View>
              <Text style={[styles.customerName, { color: colors.text }]}>{item.customer_name}</Text>
              <Text style={[styles.address, { color: colors.textSecondary }]} numberOfLines={2}>
                {item.address}
              </Text>
              <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                <Text style={[styles.itemCount, { color: colors.textMuted }]}>
                  {item.items.length} item barang
                </Text>
                {item.distance_km && (
                  <View style={styles.distanceBadge}>
                    <Navigation size={12} color={colors.accent} style={{ marginRight: 4 }} />
                    <Text style={[styles.distanceText, { color: colors.accent }]}>
                      {item.distance_km} km
                    </Text>
                  </View>
                )}
                <ChevronRight size={16} color={colors.textMuted} />
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    marginTop: 1,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderWidth: 1,
  },
  statIconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  trackingButton: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: 48,
  },
  trackingText: {
    fontWeight: '700',
    fontSize: 13,
  },
  navRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    gap: 8,
  },
  navBtn: {
    flex: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: 48,
    gap: 4,
  },
  navBtnLight: {
    flex: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: 48,
    gap: 4,
  },
  navBtnSos: {
    flex: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: 48,
    gap: 4,
  },
  navBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  navBtnTextSos: {
    fontSize: 12,
    fontWeight: '800',
  },
  offerHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  offerCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
  },
  offerActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  offerBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  orderCode: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  address: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  itemCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '700',
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
});
