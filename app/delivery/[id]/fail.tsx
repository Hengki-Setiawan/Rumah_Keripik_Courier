import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../../../src/theme';
import { failDelivery } from '../../../src/lib/api-client';

const FAIL_REASONS = [
  'Pelanggan tidak ada di tempat',
  'Alamat tidak ditemukan',
  'Pelanggan menolak',
  'Barang rusak',
  'Kendala akses jalan',
  'Lainnya',
];

export default function FailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const finalReason = reason === 'Lainnya' ? customReason : reason;
    if (!finalReason) {
      return Alert.alert('Alasan Diperlukan', 'Pilih atau tulis alasan gagal antar');
    }

    setLoading(true);
    try {
      const deliveryId = parseInt(id!, 10);
      await failDelivery(deliveryId, {
        reason: finalReason,
        notes: notes || undefined,
      });

      router.replace('/');
    } catch {
      Alert.alert('Error', 'Gagal mengupdate status');
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: 'Gagal Antar' }} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>😞</Text>
        </View>
        <Text style={styles.title}>Pengiriman Gagal</Text>
        <Text style={styles.subtitle}>Pilih alasan kegagalan pengiriman</Text>

        <View style={styles.reasons}>
          {FAIL_REASONS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.reasonItem, reason === r && styles.reasonSelected]}
              onPress={() => setReason(r)}
            >
              <Text style={[styles.reasonText, reason === r && styles.reasonTextSelected]}>
                {reason === r ? '● ' : '○ '}{r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {reason === 'Lainnya' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tulis alasan</Text>
            <TextInput
              style={styles.input}
              value={customReason}
              onChangeText={setCustomReason}
              placeholder="Jelaskan alasan..."
              editable={!loading}
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Catatan tambahan (opsional)</Text>
          <TextInput
            style={styles.textArea}
            value={notes}
            onChangeText={setNotes}
            placeholder="Tambahkan catatan..."
            multiline
            numberOfLines={3}
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, (!reason || loading) && styles.disabled]}
          onPress={handleSubmit}
          disabled={!reason || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Konfirmasi Gagal Antar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Kembali</Text>
        </TouchableOpacity>
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
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  reasons: {
    marginBottom: spacing.xl,
  },
  reasonItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reasonSelected: {
    borderColor: colors.error,
    backgroundColor: colors.errorBg,
  },
  reasonText: {
    fontSize: 14,
    color: colors.text,
  },
  reasonTextSelected: {
    color: colors.error,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.md,
    padding: spacing.md + 2,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  disabled: {
    opacity: 0.5,
  },
  submitText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  backText: {
    color: colors.accent,
    fontSize: 14,
  },
});
