import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, borderRadius } from '../../src/theme';
import Container from '../../src/components/Container';
import Card from '../../src/components/Card';
import { getStats } from '../../src/lib/api-client';

interface StatsData {
  totalAssigned: number;
  totalCompleted: number;
  totalFailed: number;
  onTimeRate: number;
  totalDistanceKm: number;
  incidentCount: number;
  score: number;
  rank: number;
  totalCouriers: number;
  completionRate: number;
}

export default function StatsScreen() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const res = await getStats(period);
      setStats(res.data);
    } catch {
      // silent
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadStats(); }, [period]);

  if (loading) {
    return (
      <Container>
        <Text style={styles.loadingText}>Memuat statistik...</Text>
      </Container>
    );
  }

  return (
    <Container>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>{'< Kembali'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Statistik</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.periodRow}>
        <TouchableOpacity
          style={[styles.periodBtn, period === 'week' && styles.periodBtnActive]}
          onPress={() => setPeriod('week')}
        >
          <Text style={[styles.periodText, period === 'week' && styles.periodTextActive]}>7 Hari</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodBtn, period === 'month' && styles.periodBtnActive]}
          onPress={() => setPeriod('month')}
        >
          <Text style={[styles.periodText, period === 'month' && styles.periodTextActive]}>30 Hari</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStats(); }} />}
      >
        {stats && (
          <>
            <Card style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Skor Kinerja</Text>
              <Text style={styles.scoreValue}>{stats.score}</Text>
              <Text style={styles.scoreRank}>Peringkat {stats.rank} dari {stats.totalCouriers} kurir</Text>
              <View style={styles.rankBar}>
                <View style={[styles.rankFill, { width: `${(1 - (stats.rank - 1) / stats.totalCouriers) * 100}%` }]} />
              </View>
            </Card>

            <View style={styles.grid}>
              <StatItem label="Ditugaskan" value={String(stats.totalAssigned)} color={colors.accent} />
              <StatItem label="Terkirim" value={String(stats.totalCompleted)} color={colors.green} />
              <StatItem label="Gagal" value={String(stats.totalFailed)} color={colors.error} />
              <StatItem label="Tepat Waktu" value={`${stats.onTimeRate}%`} color="#2563eb" />
              <StatItem label="Jarak" value={`${stats.totalDistanceKm} km`} color="#7c3aed" />
              <StatItem label="Insiden" value={String(stats.incidentCount)} color="#ea580c" />
            </View>

            <Card style={styles.rateCard}>
              <Text style={styles.rateLabel}>Tingkat Penyelesaian</Text>
              <Text style={styles.rateValue}>{stats.completionRate}%</Text>
              <View style={styles.rateBar}>
                <View style={[styles.rateFill, { width: `${stats.completionRate}%`, backgroundColor: stats.completionRate >= 80 ? colors.green : colors.accent }]} />
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </Container>
  );
}

function StatItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.gridItem}>
      <Text style={[styles.gridValue, { color }]}>{value}</Text>
      <Text style={styles.gridLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
  },
  back: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  loadingText: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 60,
    fontSize: 16,
  },
  periodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  periodBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  periodText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  periodTextActive: {
    color: '#ffffff',
  },
  scroll: {
    paddingBottom: spacing.xxl,
  },
  scoreCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  scoreLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.accent,
  },
  scoreRank: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  rankBar: {
    width: '100%',
    height: 6,
    backgroundColor: colors.surfaceDark,
    borderRadius: 3,
    overflow: 'hidden',
  },
  rankFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  gridItem: {
    width: '30%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  gridValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  gridLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rateCard: {
    paddingVertical: spacing.lg,
  },
  rateLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  rateValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  rateBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.surfaceDark,
    borderRadius: 4,
    overflow: 'hidden',
  },
  rateFill: {
    height: '100%',
    borderRadius: 4,
  },
});
