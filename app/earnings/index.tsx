import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Wallet, TrendingUp, PackageCheck } from 'lucide-react-native';

import { useAppColors, spacing, borderRadius } from '../../src/theme';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { getEarnings } from '../../src/lib/api-client';
import { SkeletonCard, SkeletonStatGrid } from '../../src/components/SkeletonLoader';
import { t } from '../../src/i18n';

interface EarningsItem {
  baseFee: number;
  bonusAmount: number;
  status: string;
  createdAt: string;
  orderId: string;
}

export default function EarningsScreen() {
  const colors = useAppColors();
  const [earnings, setEarnings] = useState<EarningsItem[]>([]);
  const [summary, setSummary] = useState({ totalConfirmed: 0, pendingTotal: 0, deliveryCount: 0, period: 'daily' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const res = await getEarnings();
      setEarnings(res.earnings || []);
      setSummary(res.summary || { totalConfirmed: 0, pendingTotal: 0, deliveryCount: 0, period: 'daily' });
    } catch (e) {
      console.error('loadEarnings failed:', e);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
      }
    }
    setLoading(false);
    setRefreshing(false);
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={{ padding: spacing.xl }}>
          <SkeletonCard lines={2} />
          <SkeletonStatGrid />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('earnings.title'),
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.accent} colors={[colors.accent]} />}
      >
        <GlassCard style={styles.summaryCard}>
          <Wallet size={24} color={colors.accent} style={{ marginBottom: spacing.sm }} />
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{t('earnings.today')}</Text>
          <Text style={[styles.summaryAmount, { color: colors.accent }]}>Rp {summary.totalConfirmed.toLocaleString('id-ID')}</Text>
          {summary.pendingTotal > 0 && (
            <Text style={[styles.pendingHint, { color: colors.textMuted }]}>
              + Rp {summary.pendingTotal.toLocaleString('id-ID')} menunggu konfirmasi
            </Text>
          )}
          <View style={styles.summaryRow}>
            <GlassCard noPadding>
              <View style={styles.statCardContent}>
                <PackageCheck size={16} color={colors.green} />
                <Text style={[styles.statValue, { color: colors.green }]}>{summary.deliveryCount}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('dashboard.completed')}</Text>
              </View>
            </GlassCard>
            <GlassCard noPadding>
              <View style={styles.statCardContent}>
                <TrendingUp size={16} color={colors.accent} />
                <Text style={[styles.statValue, { color: colors.accent }]}>{earnings.length}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('earnings.totalTasks')}</Text>
              </View>
            </GlassCard>
          </View>
        </GlassCard>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('earnings.detailHistory')}</Text>
        {earnings.length === 0 ? (
          <GlassCard noPadding>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('earnings.empty')}</Text>
          </GlassCard>
        ) : (
          earnings.map((e, i) => {
            const total = e.baseFee + e.bonusAmount;
            return (
              <TouchableOpacity
                key={e.orderId || i}
                onPress={() => {}}
              >
                <GlassCard noPadding>
                  <View style={styles.cardInner}>
                    <View style={styles.row}>
                      <Text style={[styles.orderCode, { color: colors.textSecondary }]}>
                        {e.orderId.slice(0, 10)}
                      </Text>
                      <Text style={[styles.amount, { color: e.status === 'confirmed' ? colors.green : colors.textMuted }]}>
                        Rp {total.toLocaleString('id-ID')}
                      </Text>
                    </View>
                    {e.bonusAmount > 0 && (
                      <Text style={[styles.bonusText, { color: colors.accent }]}>
                        + Bonus Rp {e.bonusAmount.toLocaleString('id-ID')}
                      </Text>
                    )}
                    <Text style={[styles.statusBadge, { color: colors.textMuted }]}>
                      {e.status === 'confirmed' ? 'Dikonfirmasi' : e.status === 'paid_out' ? 'Dibayar' : 'Menunggu'}
                    </Text>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl + 20,
  },
  summaryCard: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  summaryLabel: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: '800',
    marginVertical: spacing.md,
  },
  pendingHint: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  cardInner: {
    padding: spacing.lg,
  },
  statCardContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  bonusText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: spacing.lg,
  },
});
