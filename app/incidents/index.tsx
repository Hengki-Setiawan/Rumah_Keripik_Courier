import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, borderRadius } from '../../src/theme';
import Container from '../../src/components/Container';
import Button from '../../src/components/Button';
import { reportIncident } from '../../src/lib/api-client';
import * as Location from 'expo-location';

const INCIDENT_TYPES = [
  { id: 'kecelakaan', label: 'Kecelakaan', icon: '⚠️', severity: 'high' },
  { id: 'kendaraan_mogok', label: 'Kendaraan Mogok', icon: '🔧', severity: 'high' },
  { id: 'cuaca_ekstrem', label: 'Cuaca Ekstrem', icon: '🌧️', severity: 'medium' },
  { id: 'keamanan', label: 'Keamanan', icon: '🔒', severity: 'emergency' },
  { id: 'kesehatan', label: 'Kesehatan', icon: '🏥', severity: 'high' },
  { id: 'lainnya', label: 'Lainnya', icon: '📝', severity: 'low' },
];

export default function IncidentsScreen() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert('Pilih jenis insiden');
      return;
    }
    setLoading(true);
    try {
      let lat: string | undefined;
      let lng: string | undefined;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        lat = String(loc.coords.latitude);
        lng = String(loc.coords.longitude);
      }

      const incidentType = INCIDENT_TYPES.find((t) => t.id === selectedType);
      await reportIncident({
        type: selectedType,
        severity: incidentType?.severity || 'medium',
        description: description || undefined,
        lat,
        lng,
      });

      Alert.alert('Terlapor', 'Insiden berhasil dilaporkan. Tim akan segera merespon.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: unknown) {
      Alert.alert('Gagal', e instanceof Error ? e.message : 'Gagal melaporkan insiden');
    }
    setLoading(false);
  };

  return (
    <Container>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>{'< Kembali'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Laporkan Insiden</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.label}>Jenis Insiden</Text>
          <View style={styles.typeGrid}>
            {INCIDENT_TYPES.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.typeCard, selectedType === t.id && styles.typeCardSelected]}
                onPress={() => setSelectedType(t.id)}
              >
                <Text style={styles.typeIcon}>{t.icon}</Text>
                <Text style={[styles.typeLabel, selectedType === t.id && styles.typeLabelSelected]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: spacing.xl }]}>Deskripsi (opsional)</Text>
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={4}
            placeholder="Jelaskan kejadian..."
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
          />

          <Button
            title="Kirim Laporan"
            onPress={handleSubmit}
            variant="danger"
            loading={loading}
            disabled={!selectedType}
            style={{ marginTop: spacing.xxl }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeCard: {
    width: '30%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: colors.accent,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
