import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Car, CloudRain, Shield, Heart, MoreHorizontal, AlertTriangle, ArrowLeft, History } from 'lucide-react-native';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppColors, spacing, borderRadius } from '../../src/theme';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { reportIncident } from '../../src/lib/api-client';
import { getToken } from '../../src/lib/storage';
import { BigActionButton } from '../../src/components/ui/BigActionButton';
import { t } from '../../src/i18n';

const INCIDENT_TYPES = [
  { id: 'kecelakaan', label: 'Kecelakaan', icon: AlertTriangle, severity: 'high' },
  { id: 'kendaraan_mogok', label: 'Kendaraan Mogok', icon: Car, severity: 'high' },
  { id: 'cuaca_ekstrem', label: 'Cuaca Ekstrem', icon: CloudRain, severity: 'medium' },
  { id: 'keamanan', label: 'Keamanan', icon: Shield, severity: 'emergency' },
  { id: 'kesehatan', label: 'Kesehatan', icon: Heart, severity: 'high' },
  { id: 'lainnya', label: 'Lainnya', icon: MoreHorizontal, severity: 'low' },
];

interface IncidentHistory {
  id: number;
  type: string;
  severity: string;
  status: string;
  created_at: string;
  description: string | null;
}

export default function IncidentsScreen() {
  const colors = useAppColors();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<IncidentHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch('https://rumah-keripik.vercel.app/api/courier/incidents?limit=20', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.ok) {
        setHistory(json.data?.incidents || []);
      }
    } catch {
      console.warn('fetchIncidents failed');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
      }
    }
    setHistoryLoading(false);
  }

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert(t('incident.selectType'));
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

      Alert.alert(t('incident.reported'), t('incident.reportedMessage'), [
        { text: 'OK', onPress: () => { setShowForm(false); setSelectedType(null); setDescription(''); fetchHistory(); } },
      ]);
    } catch (e: unknown) {
      Alert.alert(t('common.failed'), e instanceof Error ? e.message : t('incident.reportFailed'));
    }
    setLoading(false);
  };

  function getSeverityColor(severity: string) {
    switch (severity) {
      case 'emergency': return colors.error;
      case 'high': return colors.warning;
      case 'medium': return colors.accent;
      default: return colors.textMuted;
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={18} color={colors.accent} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('incident.report')}</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)} style={styles.addBtn}>
          <Text style={[styles.addBtnText, { color: colors.accent }]}>{showForm ? 'Riwayat' : 'Baru'}</Text>
        </TouchableOpacity>
      </View>

      {showForm ? (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <Text style={[styles.label, { color: colors.text }]}>{t('incident.type')}</Text>
            <View style={styles.typeGrid}>
              {INCIDENT_TYPES.map((incType) => {
                const Icon = incType.icon;
                return (
                  <TouchableOpacity
                    key={incType.id}
                    onPress={() => setSelectedType(incType.id)}
                  >
                    <GlassCard
                      noPadding
                      style={styles.typeCard}
                      borderColor={selectedType === incType.id ? colors.error : undefined}
                    >
                      <Icon size={24} color={selectedType === incType.id ? colors.error : colors.accent} />
                      <Text style={[styles.typeLabel, { color: colors.text }]}>{incType.label}</Text>
                    </GlassCard>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { color: colors.text, marginTop: spacing.xl }]}>{t('incident.description')}</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              multiline
              numberOfLines={4}
              placeholder={t('incident.descriptionPlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
            />

            <BigActionButton
              label={t('incident.sendReport')}
              onPress={handleSubmit}
              variant="danger"
              loading={loading}
              disabled={!selectedType || loading}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.historyHeader}>
            <History size={18} color={colors.textSecondary} />
            <Text style={[styles.historyTitle, { color: colors.textSecondary }]}>Riwayat Insiden</Text>
          </View>
          {historyLoading ? (
            <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 40 }} />
          ) : history.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Shield size={40} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Belum ada insiden yang dilaporkan</Text>
            </View>
          ) : (
            history.map((inc) => (
              <GlassCard noPadding key={inc.id}>
                <View style={styles.historyCard}>
                  <View style={styles.historyRow}>
                    <View style={[styles.severityDot, { backgroundColor: getSeverityColor(inc.severity) }]} />
                    <Text style={[styles.historyType, { color: colors.text }]}>{inc.type}</Text>
                    <Text style={[styles.historyStatus, { color: inc.status === 'resolved' ? colors.green : colors.warning }]}>{inc.status}</Text>
                  </View>
                  {inc.description && <Text style={[styles.historyDesc, { color: colors.textSecondary }]}>{inc.description}</Text>}
                  <Text style={[styles.historyDate, { color: colors.textMuted }]}>{new Date(inc.created_at).toLocaleDateString('id-ID')}</Text>
                </View>
              </GlassCard>
            ))
          )}
          <TouchableOpacity style={styles.reportNewBtn} onPress={() => setShowForm(true)}>
            <AlertTriangle size={18} color={colors.error} style={{ marginRight: 8 }} />
            <Text style={[styles.reportNewText, { color: colors.error }]}>Laporkan Insiden Baru</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: spacing.sm },
  addBtn: { padding: spacing.sm },
  addBtnText: { fontSize: 14, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.xl, paddingBottom: spacing.xxl + 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: spacing.md },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeCard: {
    width: '30%', padding: spacing.md,
    alignItems: 'center', gap: 6,
  },
  typeLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  textInput: {
    borderRadius: borderRadius.md, borderWidth: 1, padding: spacing.md,
    fontSize: 14, minHeight: 100, textAlignVertical: 'top',
  },
  historyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.lg },
  historyTitle: { fontSize: 15, fontWeight: '700' },
  historyCard: {
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  severityDot: { width: 8, height: 8, borderRadius: 4 },
  historyType: { fontSize: 14, fontWeight: '600', flex: 1 },
  historyStatus: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  historyDesc: { fontSize: 13, marginTop: 4 },
  historyDate: { fontSize: 11, marginTop: 6 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
  reportNewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.lg, marginTop: spacing.md,
  },
  reportNewText: { fontSize: 15, fontWeight: '700' },
});
