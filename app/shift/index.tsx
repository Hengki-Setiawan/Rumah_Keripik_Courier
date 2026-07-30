import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { ArrowLeft, Clock, Calendar } from 'lucide-react-native';
import { useCallback } from 'react';

import { useAppColors, spacing, borderRadius } from '../../src/theme';
import { GlassCard } from '../../src/components/ui/GlassCard';
import Container from '../../src/components/Container';
import { clockInCourier, clockOutCourier } from '../../src/lib/api-client';
import { getToken } from '../../src/lib/storage';
import { startTracking, stopTracking } from '../../src/location/location-manager';
import { t } from '../../src/i18n';

export default function ShiftScreen() {
  const colors = useAppColors();
  const [clockedIn, setClockedIn] = useState(false);
  const [shiftId, setShiftId] = useState<number | null>(null);
  const [clockInAt, setClockInAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  async function fetchCurrentShift() {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch('https://rumah-keripik.vercel.app/api/courier/shift/current', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.ok && json.data) {
        setClockedIn(json.data.status === 'active');
        setShiftId(json.data.shiftId || null);
        setClockInAt(json.data.clockInAt || null);
      }
    } catch {
      console.warn('fetchCurrentShift failed — endpoint mungkin belum ada');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
      }
    }
    setInitialLoading(false);
  }

  useFocusEffect(
    useCallback(() => {
      fetchCurrentShift();
    }, [])
  );

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const loc = await Location.getCurrentPositionAsync({});
    return { lat: loc.coords.latitude, lng: loc.coords.longitude };
  };

  const handleClockIn = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    }
    setLoading(true);
    try {
      const loc = await getLocation();
      const res = await clockInCourier(loc?.lat, loc?.lng);
      setClockedIn(true);
      setShiftId(res.data.shiftId);
      setClockInAt(res.data.clockInAt);
      startTracking('idle');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      }
      Alert.alert(t('shift.clockInSuccess'), t('shift.clockInMessage'));
    } catch (e: unknown) {
      Alert.alert(t('common.failed'), e instanceof Error ? e.message : t('shift.clockInFail'));
    }
    setLoading(false);
  };

  const handleClockOut = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
    }
    setLoading(true);
    try {
      const loc = await getLocation();
      const res = await clockOutCourier(loc?.lat, loc?.lng);
      setClockedIn(false);
      setShiftId(null);
      setClockInAt(null);
      stopTracking();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      }
      Alert.alert(t('shift.clockOutSuccess'), t('shift.clockOutMessage', { count: res.data.totalDeliveries }));
    } catch (e: unknown) {
      Alert.alert(t('common.failed'), e instanceof Error ? e.message : t('shift.clockOutFail'));
    }
    setLoading(false);
  };

  return (
    <Container>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color={colors.accent} style={{ marginRight: 4 }} />
          <Text style={[styles.back, { color: colors.accent }]}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('shift.management')}</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.center}>
        {initialLoading ? (
          <ActivityIndicator size="large" color={colors.accent} />
        ) : (
        <GlassCard>
          <View style={styles.statusIndicator}>
            <View style={[styles.dot, clockedIn ? styles.dotActive : { backgroundColor: colors.textMuted }]} />
            <Text style={[styles.statusText, { color: colors.text }]}>
              {clockedIn ? t('shift.active') : t('shift.inactive')}
            </Text>
          </View>

          {clockedIn && clockInAt && (
            <View style={[styles.clockInTimeBadge, { backgroundColor: colors.greenLight }]}>
              <Clock size={14} color={colors.green} style={{ marginRight: 6 }} />
              <Text style={[styles.clockInTime, { color: colors.green }]}>
                {t('shift.startedAt')}: {new Date(clockInAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          )}

          <View style={styles.shiftInfo}>
            <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
              <View style={styles.infoLabelGroup}>
                <Calendar size={15} color={colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('shift.date')}</Text>
              </View>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.heroShiftButton,
              { backgroundColor: clockedIn ? colors.error : colors.accent },
              loading && styles.buttonDisabled,
            ]}
            onPress={clockedIn ? handleClockOut : handleClockIn}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="large" />
            ) : (
              <View style={styles.heroButtonInner}>
                <Text style={styles.heroButtonText}>
                  {clockedIn ? t('shift.clockOut') : t('shift.clockIn')}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </GlassCard>
        )}
      </View>
    </Container>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  shiftCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotActive: {
    backgroundColor: '#16a34a',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '800',
  },
  clockInTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  clockInTime: {
    fontSize: 13,
    fontWeight: '700',
  },
  shiftInfo: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  infoLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  heroShiftButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
    marginVertical: spacing.md,
  },
  heroButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  heroButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
