import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Platform } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Trophy,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Navigation,
  AlertTriangle,
  Award,
} from 'lucide-react-native';

import { useAppColors, spacing, borderRadius } from '../theme';
import { GlassCard } from '../components/ui/GlassCard';
import Container from '../components/Container';
import { SkeletonCard, SkeletonStatGrid } from '../components/SkeletonLoader';
import { getStats } from '../lib/api-client';

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
  const colors = useAppColors();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const res = await getStats(period);
      setStats(res.data);
    } catch (e) {
      console.error('loadStats failed:', e);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
      }
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadStats();
  }, [period]);

  function switchPeriod(p: 'week' | 'month') {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => undefined);
    }
    setPeriod(p);
  }

  if (loading) {
    return (
      <Container>
        <View style={{ paddingVertical: spacing.lg }}>
          <SkeletonCard lines={2} />
          <SkeletonStatGrid />
          <SkeletonCard lines={1} />
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color={colors.accent} style={{ marginRight: 4 }} />
          <Text style={[styles.back, { color: colors.accent }]}>Kembali</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Statistik Performa</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.periodRow}>
        <TouchableOpacity
          style={[
            styles.periodBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
            period === 'week' && { backgroundColor: colors.accent, borderColor: colors.accent },
          ]}
          onPress={() => switchPeriod('week')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.periodText,
              { color: colors.textSecondary },
              period === 'week' && { color: colors.white },
            ]}
          >
            7 Hari Terakhir
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.periodBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
            period === 'month' && { backgroundColor: colors.accent, borderColor: colors.accent },
          ]}
          onPress={() => switchPeriod('month')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.periodText,
              { color: colors.textSecondary },
              period === 'month' && { color: colors.white },
            ]}
          >
            30 Hari Terakhir
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadStats();
            }}
          />
        }
      >
        {stats && (
          <>
            <GlassCard>
              <View style={styles.scoreIconRow}>
                <Trophy size={28} color={colors.accent} />
              </View>
              <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>Skor Kinerja Kurir</Text>
              <Text style={[styles.scoreValue, { color: colors.accent }]}>{stats.score}</Text>
              <Text style={[styles.scoreRank, { color: colors.textMuted }]}>
                Peringkat #{stats.rank} dari {stats.totalCouriers} kurir aktif
              </Text>
              <View style={[styles.rankBar, { backgroundColor: colors.surfaceDark }]}>
                <View
                  style={[
                    styles.rankFill,
                    {
                      backgroundColor: colors.accent,
                      width: `${(1 - (stats.rank - 1) / Math.max(1, stats.totalCouriers)) * 100}%`,
                    },
                  ]}
                />
              </View>
            </GlassCard>

            <View style={styles.grid}>
              <StatItem
                label="Ditugaskan"
                value={String(stats.totalAssigned)}
                color={colors.accent}
                bgColor={colors.accentLight}
                icon={<Award size={18} color={colors.accent} />}
              />
              <StatItem
                label="Terkirim"
                value={String(stats.totalCompleted)}
                color={colors.green}
                bgColor={colors.greenLight}
                icon={<CheckCircle2 size={18} color={colors.green} />}
              />
              <StatItem
                label="Gagal"
                value={String(stats.totalFailed)}
                color={colors.error}
                bgColor={colors.errorBg}
                icon={<XCircle size={18} color={colors.error} />}
              />
              <StatItem
                label="Tepat Waktu"
                value={`${stats.onTimeRate}%`}
                color={colors.info}
                bgColor="rgba(61,126,166,0.12)"
                icon={<Clock size={18} color={colors.info} />}
              />
              <StatItem
                label="Total Jarak"
                value={`${stats.totalDistanceKm} km`}
                color="#7c3aed"
                bgColor="rgba(124,58,237,0.12)"
                icon={<Navigation size={18} color="#7c3aed" />}
              />
              <StatItem
                label="Insiden"
                value={String(stats.incidentCount)}
                color={colors.warning}
                bgColor="rgba(217,164,65,0.12)"
                icon={<AlertTriangle size={18} color={colors.warning} />}
              />
            </View>

            <GlassCard>
              <View style={styles.rateHeaderRow}>
                <TrendingUp size={20} color={colors.green} />
                <Text style={[styles.rateLabel, { color: colors.textSecondary }]}>
                  Tingkat Penyelesaian Pengiriman
                </Text>
              </View>
              <Text style={[styles.rateValue, { color: colors.text }]}>{stats.completionRate}%</Text>
              <View style={[styles.rateBar, { backgroundColor: colors.surfaceDark }]}>
                <View
                  style={[
                    styles.rateFill,
                    {
                      width: `${stats.completionRate}%`,
                      backgroundColor: stats.completionRate >= 80 ? colors.green : colors.accent,
                    },
                  ]}
                />
              </View>
            </GlassCard>

            <GlassCard>
              <View style={styles.badgesHeader}>
                <Award size={20} color={colors.accent} />
                <Text style={[styles.badgesTitle, { color: colors.textSecondary }]}>Pencapaian</Text>
              </View>
              <View style={styles.badgesRow}>
                {stats.score >= 80 && (
                  <View style={styles.badgeItem}>
                    <Trophy size={24} color="#d9a441" />
                    <Text style={[styles.badgeLabel, { color: colors.textMuted }]}>Top Performer</Text>
                  </View>
                )}
                {stats.incidentCount === 0 && stats.totalCompleted > 0 && (
                  <View style={styles.badgeItem}>
                    <CheckCircle2 size={24} color={colors.green} />
                    <Text style={[styles.badgeLabel, { color: colors.textMuted }]}>Zero Insiden</Text>
                  </View>
                )}
                {stats.onTimeRate >= 90 && (
                  <View style={styles.badgeItem}>
                    <Clock size={24} color="#3d7ea6" />
                    <Text style={[styles.badgeLabel, { color: colors.textMuted }]}>Tepat Waktu</Text>
                  </View>
                )}
                {stats.totalCompleted >= 10 && (
                  <View style={styles.badgeItem}>
                    <TrendingUp size={24} color="#7f9f3e" />
                    <Text style={[styles.badgeLabel, { color: colors.textMuted }]}>10+ Kiriman</Text>
                  </View>
                )}
              </View>
              {stats.score < 80 && stats.incidentCount > 0 && stats.totalCompleted === 0 && (
                <Text style={[styles.badgesEmpty, { color: colors.textMuted }]}>
                  Selesaikan pengiriman untuk membuka pencapaian
                </Text>
              )}
            </GlassCard>
          </>
        )}
      </ScrollView>
    </Container>
  );
}

function StatItem({
  label,
  value,
  color,
  bgColor,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}) {
  const colors = useAppColors();
  return (
    <GlassCard noPadding style={styles.gridItem}>
      <View style={styles.gridItemInner}>
        <View style={[styles.itemIconWrapper, { backgroundColor: bgColor }]}>{icon}</View>
        <Text style={[styles.gridValue, { color }]}>{value}</Text>
        <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>{label}</Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
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
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 60,
    fontSize: 15,
    fontWeight: '500',
  },
  periodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  periodBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
  },
  periodText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scroll: {
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  scoreCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  scoreIconRow: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(197,90,43,0.12)',
    marginBottom: spacing.xs,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '800',
  },
  scoreRank: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  rankBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  rankFill: {
    height: '100%',
    borderRadius: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridItem: {
    width: '31%',
    minHeight: 100,
  },
  gridItemInner: {
    alignItems: 'center',
    padding: spacing.md,
    justifyContent: 'center',
  },
  itemIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  gridValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  rateCard: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  rateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  rateLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  rateValue: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  rateBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  rateFill: {
    height: '100%',
    borderRadius: 4,
  },
  badgesCard: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  badgesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  badgesTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  badgeItem: {
    alignItems: 'center',
    gap: 4,
    minWidth: 70,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  badgesEmpty: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
