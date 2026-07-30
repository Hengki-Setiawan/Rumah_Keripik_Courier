import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, borderRadius } from '../../src/theme';
import Container from '../../src/components/Container';
import Card from '../../src/components/Card';
import Button from '../../src/components/Button';
import { clockInCourier, clockOutCourier } from '../../src/lib/api-client';
import * as Location from 'expo-location';

export default function ShiftScreen() {
  const [clockedIn, setClockedIn] = useState(false);
  const [shiftId, setShiftId] = useState<number | null>(null);
  const [clockInAt, setClockInAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const loc = await Location.getCurrentPositionAsync({});
    return { lat: loc.coords.latitude, lng: loc.coords.longitude };
  };

  const handleClockIn = async () => {
    setLoading(true);
    try {
      const loc = await getLocation();
      const res = await clockInCourier(loc?.lat, loc?.lng);
      setClockedIn(true);
      setShiftId(res.data.shiftId);
      setClockInAt(res.data.clockInAt);
    } catch (e: unknown) {
      Alert.alert('Gagal', e instanceof Error ? e.message : 'Gagal clock-in');
    }
    setLoading(false);
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      const loc = await getLocation();
      const res = await clockOutCourier(loc?.lat, loc?.lng);
      setClockedIn(false);
      setShiftId(null);
      setClockInAt(null);
      Alert.alert('Clock-Out', `Shift selesai. ${res.data.totalDeliveries} delivery hari ini.`);
    } catch (e: unknown) {
      Alert.alert('Gagal', e instanceof Error ? e.message : 'Gagal clock-out');
    }
    setLoading(false);
  };

  return (
    <Container>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>{'< Kembali'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Manajemen Shift</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.center}>
        <Card style={styles.shiftCard}>
          <View style={styles.statusIndicator}>
            <View style={[styles.dot, clockedIn ? styles.dotActive : styles.dotInactive]} />
            <Text style={styles.statusText}>{clockedIn ? 'Sedang Bertugas' : 'Belum Clock-In'}</Text>
          </View>

          {clockedIn && clockInAt && (
            <Text style={styles.clockInTime}>
              Mulai: {new Date(clockInAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}

          <View style={styles.shiftInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tanggal</Text>
              <Text style={styles.infoValue}>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
            </View>
          </View>
        </Card>

        <Button
          title={clockedIn ? 'Clock-Out & Akhiri Shift' : 'Clock-In & Mulai Shift'}
          onPress={clockedIn ? handleClockOut : handleClockIn}
          variant={clockedIn ? 'danger' : 'primary'}
          loading={loading}
          style={styles.mainButton}
        />
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
  center: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  shiftCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotActive: {
    backgroundColor: '#16a34a',
  },
  dotInactive: {
    backgroundColor: colors.textMuted,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  clockInTime: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  shiftInfo: {
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  mainButton: {
    marginTop: spacing.xxl,
  },
});
