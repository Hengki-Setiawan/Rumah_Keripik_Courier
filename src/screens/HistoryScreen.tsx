import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { Search } from 'lucide-react-native';

import { useAppColors, spacing, borderRadius } from '../theme';
import { getDeliveryHistory } from '../lib/api-client';
import { DeliveryCard } from '../components/ui/DeliveryCard';
import { SkeletonCard } from '../components/SkeletonLoader';
import { t } from '../i18n';
import type { CourierDeliveryDto } from '../lib/types';

const PAGE_SIZE = 50;

export default function HistoryScreen() {
  const colors = useAppColors();
  const [deliveries, setDeliveries] = useState<CourierDeliveryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [showFilter, setShowFilter] = useState(false);

  const loadHistory = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    try {
      const data = await getDeliveryHistory(PAGE_SIZE, currentOffset, statusFilter);
      if (reset) {
        setDeliveries(data.deliveries);
      } else {
        setDeliveries((prev) => [...prev, ...data.deliveries]);
      }
      setHasMore(data.pagination.hasMore);
      setOffset(currentOffset + data.deliveries.length);
    } catch (e) {
      console.error('loadHistory failed:', e);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
      }
    }
    setLoading(false);
    setRefreshing(false);
    setLoadingMore(false);
  }, [offset, statusFilter]);

  useEffect(() => {
    setLoading(true);
    loadHistory(true);
  }, [statusFilter]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <Stack.Screen options={{ headerShown: true, title: t('history.title'), headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }} />
        <View style={{ padding: spacing.xl }}>
          <SkeletonCard lines={2} />
          <SkeletonCard lines={1} />
          <SkeletonCard lines={2} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('history.title'),
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, !statusFilter && { backgroundColor: colors.accent }]}
          onPress={() => { setStatusFilter(undefined); setShowFilter(false); }}
        >
          <Text style={[styles.filterText, { color: !statusFilter ? '#fff' : colors.textMuted }]}>
            Semua
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, statusFilter === 'Terkirim' && { backgroundColor: colors.green }]}
          onPress={() => { setStatusFilter('Terkirim'); setShowFilter(false); }}
        >
          <Text style={[styles.filterText, { color: statusFilter === 'Terkirim' ? '#fff' : colors.textMuted }]}>
            Terkirim
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, statusFilter === 'Gagal' && { backgroundColor: colors.error }]}
          onPress={() => { setStatusFilter('Gagal'); setShowFilter(false); }}
        >
          <Text style={[styles.filterText, { color: statusFilter === 'Gagal' ? '#fff' : colors.textMuted }]}>
            Gagal
          </Text>
        </TouchableOpacity>
      </View>

      <FlashList
        data={deliveries}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadHistory(true); }}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        onEndReached={() => {
          if (hasMore && !loadingMore) {
            setLoadingMore(true);
            loadHistory();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator size="small" color={colors.accent} style={{ paddingVertical: 20 }} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Search size={48} color={colors.textMuted} />
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              {t('history.empty')}
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
            onPress={() => router.push(`/delivery/${item.id}`)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    minHeight: 36,
    justifyContent: 'center',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
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
