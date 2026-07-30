import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { ShieldAlert, AlertTriangle, PhoneCall, ArrowLeft } from 'lucide-react-native';

import { useAppColors, spacing, borderRadius } from '../../src/theme';
import { getToken } from '../../src/lib/storage';

const SOS_CONTACTS = process.env.EXPO_PUBLIC_SOS_PHONE || '08123456789';

export default function SosScreen() {
  const colors = useAppColors();
  const [sending, setSending] = useState(false);

  async function handleSos() {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
    }
    setSending(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let location = null;
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        location = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      }
      const token = await getToken();
      await fetch('https://rumah-keripik.vercel.app/api/courier/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify({ location, timestamp: new Date().toISOString() }),
      });
      Alert.alert(
        'Sinyal Darurat SOS Terkirim',
        'Bantuan sedang diproses. Tim Admin telah menerima lokasi GPS darurat Anda dan akan segera menghubungi.'
      );
      router.back();
    } catch {
      Alert.alert(
        'Gagal Mengirim Sinyal SOS',
        'Tidak dapat terhubung ke server. Silakan langsung telepon Admin Darurat di: ' + SOS_CONTACTS
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen
        options={{
          title: 'Sinyal Darurat SOS',
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
      <View style={styles.content}>
        <View style={[styles.alertIconBadge, { backgroundColor: colors.errorBg }]}>
          <ShieldAlert size={40} color={colors.error} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Sinyal SOS Darurat</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Tekan tombol di bawah untuk membunyikan alarm bantuan darurat & lokasi GPS ke Tim Admin.
        </Text>

        <TouchableOpacity
          style={[styles.sosButton, { backgroundColor: colors.error }, sending && styles.disabled]}
          onPress={handleSos}
          disabled={sending}
          activeOpacity={0.8}
        >
          {sending ? (
            <ActivityIndicator size="large" color="#ffffff" />
          ) : (
            <View style={styles.sosInner}>
              <ShieldAlert size={48} color="#ffffff" style={{ marginBottom: 4 }} />
              <Text style={styles.sosText}>SOS</Text>
            </View>
          )}
        </TouchableOpacity>

        {sending && (
          <Text style={[styles.sendingText, { color: colors.accent }]}>
            Mengirim lokasi GPS & sinyal darurat ke server...
          </Text>
        )}

        <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <AlertTriangle size={18} color={colors.warning} style={{ marginRight: 8 }} />
          <Text style={[styles.info, { color: colors.textMuted }]}>
            Lokasi presisi GPS kurir akan langsung terkirim ke peta monitor admin untuk penanganan instan.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  alertIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  sosButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    elevation: 8,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
  },
  sosInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
  },
  disabled: {
    opacity: 0.6,
  },
  sendingText: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  info: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
});
