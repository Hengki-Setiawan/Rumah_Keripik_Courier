import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { XCircle, ArrowLeft } from 'lucide-react-native';

import { useAppColors, spacing, borderRadius } from '../../../src/theme';
import { GlassCard } from '../../../src/components/ui/GlassCard';
import { failDelivery } from '../../../src/lib/api-client';
import { BigActionButton } from '../../../src/components/ui/BigActionButton';
import { stopTracking } from '../../../src/location/location-manager';
import { enqueueRequest, recordSyncAudit } from '../../../src/lib/offline-queue';
import { getToken } from '../../../src/lib/storage';
import { t } from '../../../src/i18n';

const FAIL_REASONS = [
  'Pelanggan tidak ada di tempat',
  'Alamat tidak ditemukan',
  'Pelanggan menolak',
  'Barang rusak',
  'Kendala akses jalan',
  'Lainnya',
];

const DRAFT_KEY = 'fail_draft_';

export default function FailScreen() {
  const colors = useAppColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  async function saveDraft() {
    try {
      await AsyncStorage.setItem(DRAFT_KEY + id, JSON.stringify({ reason, customReason, notes }));
    } catch { /* silent */ }
  }

  async function handleSubmit() {
    const finalReason = reason === 'Lainnya' ? customReason : reason;
    if (!finalReason) {
      return Alert.alert(t('delivery.reasonRequired'), t('delivery.chooseOrWriteReason'));
    }
    setLoading(true);
    await saveDraft();
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      const token = await getToken();
      const deliveryId = parseInt(id!, 10);
      await enqueueRequest(
        `/api/courier/deliveries/${deliveryId}/fail`,
        'POST',
        { delivery_id: deliveryId, reason: finalReason, notes: notes || undefined },
        token,
        'STATUS_UPDATE',
        'high'
      );
      await recordSyncAudit({ deliveryId, action: 'fail', serverVerified: false });
      await saveDraft();
      setLoading(false);
      router.replace('/(tabs)' as any);
      return;
    }
    try {
      const deliveryId = parseInt(id!, 10);
      await failDelivery(deliveryId, {
        reason: finalReason,
        notes: notes || undefined,
      });
      await AsyncStorage.removeItem(DRAFT_KEY + id);
      stopTracking();
      router.replace('/(tabs)' as any);
    } catch {
      await saveDraft();
      Alert.alert(t('common.error'), 'Gagal mengirim. Draft tersimpan dan akan dikirim ulang otomatis.');
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('delivery.failDelivery'),
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.iconContainer}>
          <XCircle size={48} color={colors.error} />
        </View>
        <Text style={[styles.title, { color: colors.error }]}>{t('delivery.deliveryFailed')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('delivery.selectFailReason')}</Text>

        <View style={styles.reasons}>
          {FAIL_REASONS.map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setReason(r)}
            >
              <GlassCard
                noPadding
                borderColor={reason === r ? colors.error : undefined}
                style={reason === r ? { backgroundColor: colors.errorBg } : undefined}
              >
                <Text style={[styles.reasonText, { color: colors.text }, reason === r && { color: colors.error, fontWeight: '700' }]}>
                  {r}
                </Text>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>

        {reason === 'Lainnya' && (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t('delivery.writeReason')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={customReason}
              onChangeText={setCustomReason}
              placeholder={t('delivery.reasonPlaceholder')}
              placeholderTextColor={colors.textMuted}
              editable={!loading}
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>{t('delivery.additionalNotes')}</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('delivery.notesPlaceholder')}
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            editable={!loading}
          />
        </View>

        <BigActionButton
          label={t('delivery.confirmFail')}
          onPress={handleSubmit}
          loading={loading}
          disabled={!reason || loading}
          variant="danger"
          icon={XCircle}
        />

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={16} color={colors.accent} style={{ marginRight: 6 }} />
          <Text style={[styles.backText, { color: colors.accent }]}>{t('common.back')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl + 20,
    gap: spacing.lg,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  reasons: {
    marginBottom: spacing.xl,
  },
  reasonItem: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  reasonText: {
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  input: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 14,
    borderWidth: 1,
  },
  textArea: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 14,
    borderWidth: 1,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
