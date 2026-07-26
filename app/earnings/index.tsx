import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { colors, spacing, borderRadius } from '../../src/theme';
import { getTodayDeliveries } from '../../src/lib/api-client';
import type { CourierDeliveryDto } from '../../src/lib/types';

export default function EarningsScreen() {
  const [deliveries, setDeliveries] = useState<CourierDeliveryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const data = await getTodayDeliveries();
      setDeliveries(data.deliveries || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }

  const completed = deliveries.filter((d) => d.status === 'Terkirim');
  const failed = deliveries.filter((d) => d.status === 'Gagal');
  const totalEarnings = completed.reduce((sum, d) => {
    const itemTotal = d.items.reduce((s, item) => s + item.price * item.quantity, 0);
    const fee = Math.round(itemTotal * 0.1);
    return sum + Math.max(fee, 5000);
  }, 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.accent} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: 'Pendapatan Saya' }} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
      >
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Pendapatan Hari Ini</Text>
          <Text style={styles.summaryAmount}>Rp {totalEarnings.toLocaleString('id-ID')}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemValue}>{completed.length}</Text>
              <Text style={styles.summaryItemLabel}>Terkirim</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryItemValue, { color: colors.error }]}>{failed.length}</Text>
              <Text style={styles.summaryItemLabel}>Gagal</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemValue}>{deliveries.length}</Text>
              <Text style={styles.summaryItemLabel}>Total Tugas</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Riwayat Detail</Text>
        {completed.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>Belum ada pengiriman selesai hari ini</Text>
          </View>
        ) : (
          completed.map((d) => {
            const itemTotal = d.items.reduce((s, item) => s + item.price * item.quantity, 0);
            const fee = Math.max(Math.round(itemTotal * 0.1), 5000);
            return (
              <TouchableOpacity key={d.id} style={styles.card} onPress={() => router.push(`/delivery/${d.id}`)}>
                <View style={styles.row}>
                  <Text style={styles.orderCode}>{d.kode_pesanan}</Text>
                  <Text style={styles.amount}>Rp {fee.toLocaleString('id-ID')}</Text>
                </View>
                <Text style={styles.customerName}>{d.customer_name}</Text>
                <Text style={styles.itemSummary}>{d.items.map((i) => `${i.name} x${i.quantity}`).join(', ')}</Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl + 20,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.accent,
    marginVertical: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: spacing.sm,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryItemValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  summaryItemLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  orderCode: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.green,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  itemSummary: {
    fontSize: 12,
    color: colors.textMuted,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 14,
    paddingVertical: spacing.lg,
  },
});