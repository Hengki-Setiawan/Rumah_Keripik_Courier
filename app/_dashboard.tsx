import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  Image,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList, FlashListRef } from '@shopify/flash-list';
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
  Compass,
  Check,
  X,
  Navigation,
} from 'lucide-react-native';

import { useAppColors, spacing, borderRadius } from '../src/theme';
import { getTodayDeliveries, getProfile, respondToOffer } from '../src/lib/api-client';
import { getCourierData, removeToken } from '../src/lib/storage';
import { startLocationTracking, stopLocationTracking } from '../src/lib/location';
import { registerForPushNotifications, setupNotificationListener } from '../src/lib/notifications';
import { useAuth } from '../src/lib/auth-guard';
import OfflineBanner from '../src/components/OfflineBanner';
import { DeliveryCard } from '../src/components/ui/DeliveryCard';
import { StatCard } from '../src/components/ui/StatCard';
import { BigActionButton } from '../src/components/ui/BigActionButton';
import { FloatingSosButton } from '../src/components/FloatingSosButton';
import { t } from '../src/i18n';
import {
  usePressAnimation,
  StaggerFadeInUp,
  StaggerFadeIn,
} from '../src/hooks/useMicroInteraction';
import { impactMedium, impactLight } from '../src/lib/haptics';
import type { CourierDeliveryDto, CourierDto } from '../src/lib/types';

export default function DashboardScreen() {
  const colors = useAppColors();
  const { signOut } = useAuth();
  const [courier, setCourier] = useState<CourierDto | null>(null);
  const [deliveries, setDeliveries] = useState<CourierDeliveryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [respondedIds, setRespondedIds] = useState<number[]>([]);
  const { animatedStyle: pressStyle, onPressIn, onPressOut } = usePressAnimation();

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
      signOut();
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
        signOut();
      }
    }
    setLoading(false);
    setRefreshing(false);
  }

  async function toggleTracking() {
    if (Platform.OS !== 'web') impactMedium();
    if (tracking) {
      await stopLocationTracking();
      setTracking(false);
    } else {
      await startLocationTracking();
      setTracking(true);
    }
  }

  async function handleLogout() {
    if (Platform.OS !== 'web') impactLight();
    Alert.alert(t('auth.logoutTitle'), t('auth.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('auth.logout'),
        style: 'destructive',
        onPress: async () => {
          await stopLocationTracking();
          await signOut();
        },
      },
    ]);
  }

  const offers = deliveries.filter((d) => d.status === 'Siap_Dikirim' && !respondedIds.includes(d.id));
  const pendingDeliveries = deliveries.filter((d) => d.status === 'Dalam_Pengiriman');
  const completedDeliveries = deliveries.filter((d) => d.status === 'Terkirim');
  const failedDeliveries = deliveries.filter((d) => d.status === 'Gagal');
  const listRef = useRef<FlashListRef<CourierDeliveryDto>>(null);
  const [timers, setTimers] = useState<Record<number, number>>({});
  const [responding, setResponding] = useState<Record<number, boolean>>({});
  const filteredDeliveries = deliveries.filter((d) => d.status !== 'Siap_Dikirim');

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
    if (Platform.OS !== 'web') impactMedium();
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

  function goToDetail(delivery: CourierDeliveryDto) {
    if (Platform.OS !== 'web') impactLight();
    router.push(`/delivery/${delivery.id}` as any);
  }

  // --- Context-aware adaptive action ---
  const activeDelivery = deliveries.find((d) => d.status === 'Dalam_Pengiriman');
  const nextAssigned = deliveries.find((d) => d.status === 'Siap_Dikirim');

  function getContextAction() {
    if (activeDelivery) {
      return {
        label: `Lanjutkan Antar: ${activeDelivery.customer_name}`,
        icon: Navigation,
        onPress: () => router.push(`/delivery/${activeDelivery.id}` as any),
      };
    }
    if (nextAssigned) {
      return {
        label: `Mulai Antar: ${nextAssigned.customer_name}`,
        icon: MapPin,
        onPress: () => router.push(`/delivery/${nextAssigned.id}` as any),
      };
    }
    return null;
  }

  const contextAction = getContextAction();

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

      {/* Header Bar — Zona 3: Hard-to-Reach */}
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
              {t('dashboard.greeting', { name: courier?.name || t('common.courier') })}
            </Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
              {t('dashboard.deliveriesToday', { count: deliveries.length })}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          style={[styles.logoutBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          activeOpacity={0.7}
          accessibilityLabel="Keluar"
          accessibilityRole="button"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <LogOut size={16} color={colors.error} />
        </TouchableOpacity>
      </View>

      {/* Stat Summary Cards — with stagger animation */}
      <Animated.View style={styles.statsRow}
        entering={StaggerFadeInUp(0)}
      >
        <Animated.View style={{ flex: 1 }} entering={StaggerFadeInUp(1)}>
          <StatCard
            icon={<Truck size={16} color={colors.accent} />}
            value={pendingDeliveries.length}
            label={t('dashboard.pending')}
            color={colors.accent}
          />
        </Animated.View>
        <Animated.View style={{ flex: 1 }} entering={StaggerFadeInUp(2)}>
          <StatCard
            icon={<CheckCircle2 size={16} color={colors.green} />}
            value={completedDeliveries.length}
            label={t('dashboard.completed')}
            color={colors.green}
          />
        </Animated.View>
        <Animated.View style={{ flex: 1 }} entering={StaggerFadeInUp(3)}>
          <StatCard
            icon={<XCircle size={16} color={colors.error} />}
            value={failedDeliveries.length}
            label={t('dashboard.failed')}
            color={colors.error}
          />
        </Animated.View>
      </Animated.View>

      {/* Adaptive Context-Aware BigActionButton */}
      {contextAction && (
        <Animated.View
          style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.md }}
          entering={StaggerFadeInUp(4)}
        >
          <BigActionButton
            label={contextAction.label}
            onPress={contextAction.onPress}
            icon={contextAction.icon}
            variant="primary"
          />
        </Animated.View>
      )}

      {/* Tracking Toggle Bar */}
      <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.md }}>
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
          accessibilityLabel={tracking ? 'Lacak lokasi aktif' : 'Mulai lacak lokasi'}
          accessibilityRole="switch"
          accessibilityState={{ checked: tracking }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Compass size={18} color={tracking ? colors.green : colors.accent} style={{ marginRight: 8 }} />
          <Text style={[styles.trackingText, { color: tracking ? colors.green : colors.accent }]}>
            {tracking ? t('dashboard.trackingActive') : t('dashboard.startTracking')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Navigation Grid — 2 baris × 4 kolom */}
      <View style={styles.navGrid}>
        <TouchableOpacity
          style={[styles.navBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push('/route/today' as any)}
          activeOpacity={0.7}
          accessibilityLabel={t('nav.routeMap')}
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <MapPin size={16} color={colors.accent} />
          <Text style={[styles.navBtnText, { color: colors.text }]}>{t('nav.routeMap')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push('/shift' as any)}
          activeOpacity={0.7}
          accessibilityLabel={t('nav.shift')}
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Clock size={16} color={colors.accent} />
          <Text style={[styles.navBtnText, { color: colors.text }]}>{t('nav.shift')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push('/earnings' as any)}
          activeOpacity={0.7}
          accessibilityLabel={t('nav.earnings')}
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Wallet size={16} color={colors.green} />
          <Text style={[styles.navBtnText, { color: colors.text }]}>{t('nav.earnings')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtnSos, { backgroundColor: colors.errorBg, borderColor: colors.errorBorder }]}
          onPress={() => router.push('/sos')}
          activeOpacity={0.7}
          accessibilityLabel="Tombol darurat SOS"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <ShieldAlert size={16} color={colors.error} />
          <Text style={[styles.navBtnTextSos, { color: colors.error }]}>{t('nav.sos')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.navGrid}>
        <TouchableOpacity
          style={[styles.navBtnLight, { backgroundColor: colors.surfaceDark, borderColor: colors.border }]}
          onPress={() => router.push('/notifications' as any)}
          activeOpacity={0.7}
          accessibilityLabel={t('nav.notifications')}
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Bell size={16} color={colors.textSecondary} />
          <Text style={[styles.navBtnText, { color: colors.text }]}>{t('nav.notifications')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtnLight, { backgroundColor: colors.surfaceDark, borderColor: colors.border }]}
          onPress={() => router.push('/incidents' as any)}
          activeOpacity={0.7}
          accessibilityLabel={t('nav.incidents')}
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <AlertTriangle size={16} color={colors.warning} />
          <Text style={[styles.navBtnText, { color: colors.text }]}>{t('nav.incidents')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtnLight, { backgroundColor: colors.surfaceDark, borderColor: colors.border }]}
          onPress={() => router.push('/(tabs)/history' as any)}
          activeOpacity={0.7}
          accessibilityLabel={t('nav.history')}
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <History size={16} color={colors.textSecondary} />
          <Text style={[styles.navBtnText, { color: colors.text }]}>{t('nav.history')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtnLight, { backgroundColor: colors.surfaceDark, borderColor: colors.border }]}
          onPress={() => router.push('/(tabs)/stats' as any)}
          activeOpacity={0.7}
          accessibilityLabel={t('nav.stats')}
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <CheckCircle2 size={16} color={colors.textSecondary} />
          <Text style={[styles.navBtnText, { color: colors.text }]}>{t('nav.stats')}</Text>
        </TouchableOpacity>
      </View>

      {/* New Delivery Offers */}
      {offers.length > 0 && (
        <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.md }}>
          <View style={styles.offerHeaderTitle}>
            <PackageCheck size={18} color={colors.accent} style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.accent }}>
              {t('dashboard.newOffers', { count: offers.length })}
            </Text>
          </View>
          {offers.map((offer) => {
            const remaining = timers[offer.id] ?? 45;
            return (
              <Animated.View
                key={offer.id}
                entering={StaggerFadeIn(offer.id, 50)}
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
                    accessibilityLabel={`Terima tawaran ${offer.kode_pesanan}`}
                    accessibilityRole="button"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Check size={16} color={colors.white} style={{ marginRight: 4 }} />
                    <Text style={styles.offerBtnText}>{t('dashboard.accept')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rejectBtn, { backgroundColor: colors.error }]}
                    onPress={() => handleRespond(offer.id, 'reject')}
                    disabled={responding[offer.id]}
                    activeOpacity={0.8}
                    accessibilityLabel={`Tolak tawaran ${offer.kode_pesanan}`}
                    accessibilityRole="button"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={16} color={colors.white} style={{ marginRight: 4 }} />
                    <Text style={styles.offerBtnText}>{t('dashboard.reject')}</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            );
          })}
        </View>
      )}

      {/* Zona 2: Main Delivery List */}
      <FlashList
        ref={listRef}
        data={filteredDeliveries}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadDeliveries();
            }}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <PackageCheck size={48} color={colors.textMuted} />
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              {t('dashboard.noDeliveries')}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <DeliveryCard
            id={item.id}
            kodePesanan={item.kode_pesanan}
            customerName={item.customer_name}
            address={item.address}
            status={item.status}
            itemsCount={item.items.length}
            distanceKm={item.distance_km}
            onPress={() => goToDetail(item)}
          />
        )}
      />
      <FloatingSosButton />
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
  trackingButton: {
    flexDirection: 'row',
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
  navGrid: {
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
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  address: {
    fontSize: 13,
    lineHeight: 18,
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
