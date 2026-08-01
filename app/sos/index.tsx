import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { ShieldAlert, AlertTriangle, PhoneCall, MessageCircle } from 'lucide-react-native';

import { useAppColors, spacing, borderRadius } from '../../src/theme';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { getToken } from '../../src/lib/storage';
import { SOS_FALLBACK_CONTACTS } from '../../src/lib/theme-context';
import { t } from '../../src/i18n';

const SOS_CONTACTS = process.env.EXPO_PUBLIC_SOS_PHONE || SOS_FALLBACK_CONTACTS[0];

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
        t('sos.sentTitle'),
        t('sos.sent')
      );
      router.back();
    } catch {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
      }
      Alert.alert(
        t('sos.failTitle'),
        t('sos.failMessage', { phone: SOS_CONTACTS })
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen
        options={{
          title: t('sos.title'),
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
      <View style={styles.content}>
        <View style={[styles.alertIconBadge, { backgroundColor: colors.errorBg }]}>
          <ShieldAlert size={40} color={colors.error} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{t('sos.title')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('sos.instructions')}
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
            {t('sos.sending')}
          </Text>
        )}

        {!sending && (
          <TouchableOpacity
            style={[styles.whatsappBtn, { backgroundColor: '#25D366' }]}
            onPress={() => {
              const msg = encodeURIComponent('SOS Darurat — Saya butuh bantuan segera!');
              const url = `whatsapp://send?phone=${SOS_CONTACTS}&text=${msg}`;
              Linking.openURL(url).catch(() => {
                Alert.alert('WhatsApp tidak terinstall', `Hubungi ${SOS_CONTACTS} langsung`);
              });
            }}
          >
            <MessageCircle size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.whatsappBtnText}>Chat WhatsApp Darurat</Text>
          </TouchableOpacity>
        )}

        <GlassCard noPadding>
          <View style={styles.contactsBox}>
            <PhoneCall size={14} color={colors.textMuted} style={{ marginRight: 6 }} />
            <Text style={[styles.contactsText, { color: colors.textMuted }]}>
              Kontak darurat: {SOS_FALLBACK_CONTACTS.join(', ')}
            </Text>
          </View>
        </GlassCard>

        <GlassCard noPadding>
          <View style={styles.infoBox}>
            <AlertTriangle size={18} color={colors.warning} style={{ marginRight: 8 }} />
            <Text style={[styles.info, { color: colors.textMuted }]}>
              {t('sos.info')}
            </Text>
          </View>
        </GlassCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  disabled: { opacity: 0.6 },
  sendingText: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  whatsappBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24, paddingVertical: spacing.md,
    borderRadius: borderRadius.md, marginBottom: spacing.md, minHeight: 48,
  },
  whatsappBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  contactsBox: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
  },
  contactsText: { fontSize: 12, fontWeight: '500' },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  info: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
});
