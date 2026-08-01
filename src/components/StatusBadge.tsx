import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';

type StatusVariant = 'active' | 'completed' | 'failed' | 'pending' | 'cancelled' | 'online' | 'offline';

interface StatusBadgeProps {
  status: StatusVariant | string;
  label?: string;
}

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  active: { label: 'Aktif', bg: '#dcfce7', text: '#166534' },
  completed: { label: 'Selesai', bg: '#dcfce7', text: '#166534' },
  failed: { label: 'Gagal', bg: '#fef2f2', text: '#dc2626' },
  pending: { label: 'Menunggu', bg: '#fef9c3', text: '#a16207' },
  cancelled: { label: 'Batal', bg: '#f3f4f6', text: '#6b7280' },
  online: { label: 'Online', bg: '#dcfce7', text: '#166534' },
  offline: { label: 'Offline', bg: '#f3f4f6', text: '#6b7280' },
  Siap_Dikirim: { label: 'Siap Diambil', bg: '#fef9c3', text: '#a16207' },
  Dalam_Pengiriman: { label: 'Diantar', bg: '#dbeafe', text: '#1e40af' },
  Terkirim: { label: 'Terkirim', bg: '#dcfce7', text: '#166534' },
  Gagal: { label: 'Gagal', bg: '#fef2f2', text: '#dc2626' },
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: label || status, bg: '#f3f4f6', text: '#6b7280' };
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
