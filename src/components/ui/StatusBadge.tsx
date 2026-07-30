import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing } from '../../theme';

const STATUS_MAP: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: 'Menunggu', bg: '#fef3c7', fg: '#92400e' },
  menunggu: { label: 'Menunggu', bg: '#fef3c7', fg: '#92400e' },
  in_transit: { label: 'Dalam Perjalanan', bg: '#dbeafe', fg: '#1e40af' },
  dalam_pengiriman: { label: 'Dalam Perjalanan', bg: '#dbeafe', fg: '#1e40af' },
  arrived: { label: 'Tiba', bg: '#d1fae5', fg: '#065f46' },
  completed: { label: 'Selesai', bg: '#d1fae5', fg: '#065f46' },
  selesai: { label: 'Selesai', bg: '#d1fae5', fg: '#065f46' },
  failed: { label: 'Gagal', bg: '#fee2e2', fg: '#991b1b' },
  cancelled: { label: 'Dibatalkan', bg: '#e5e7eb', fg: '#4b5563' },
  assigned: { label: 'Ditugaskan', bg: '#ede9fe', fg: '#5b21b6' },
};

export default function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase().replace(/[^a-z_]/g, '');
  const config = STATUS_MAP[normalized] || STATUS_MAP[Object.keys(STATUS_MAP).find(k => normalized.includes(k)) || 'pending'];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.fg }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
