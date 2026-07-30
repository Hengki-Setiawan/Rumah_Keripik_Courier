import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin, Navigation, ChevronRight } from 'lucide-react-native';
import { useAppColors, spacing, borderRadius } from '../../theme';

interface DeliveryCardProps {
  id: string | number;
  kodePesanan: string;
  customerName: string;
  address: string;
  status: string;
  itemsCount?: number;
  distanceKm?: number | string | null;
  urgency?: 'critical' | 'urgent' | 'normal' | 'idle';
  onPress: () => void;
}

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  Siap_Dikirim: { label: 'Siap Dikirim', bg: 'rgba(61,126,166,0.12)', color: '#3d7ea6' },
  Dalam_Pengiriman: { label: 'Dalam Perjalanan', bg: 'rgba(197,90,43,0.12)', color: '#c55a2b' },
  Terkirim: { label: 'Terkirim', bg: 'rgba(127,159,62,0.12)', color: '#7f9f3e' },
  Gagal: { label: 'Gagal', bg: 'rgba(192,57,43,0.12)', color: '#c0392b' },
};

export function DeliveryCard({
  kodePesanan,
  customerName,
  address,
  status,
  itemsCount,
  distanceKm,
  urgency,
  onPress,
}: DeliveryCardProps) {
  const colors = useAppColors();
  const badge = statusConfig[status] ?? { label: status, bg: colors.surfaceDark, color: colors.textMuted };

  const urgencyColor = urgency === 'critical' ? colors.error
    : urgency === 'urgent' ? colors.warning
    : undefined;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: urgencyColor ?? colors.border,
          borderLeftColor: urgencyColor ?? colors.border,
          borderLeftWidth: urgencyColor ? 4 : 1,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.orderCode, { color: colors.textSecondary }]}>{kodePesanan}</Text>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
        </View>
      </View>
      <Text style={[styles.customerName, { color: colors.text }]}>{customerName}</Text>
      <Text style={[styles.address, { color: colors.textSecondary }]} numberOfLines={2}>
        {address}
      </Text>
      <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
        {itemsCount != null && (
          <Text style={[styles.itemCount, { color: colors.textMuted }]}>
            {itemsCount} item barang
          </Text>
        )}
        {distanceKm != null && (
          <View style={styles.distanceBadge}>
            <Navigation size={12} color={colors.accent} style={{ marginRight: 4 }} />
            <Text style={[styles.distanceText, { color: colors.accent }]}>
              {typeof distanceKm === 'string' ? parseFloat(distanceKm).toFixed(2) : distanceKm} km
            </Text>
          </View>
        )}
        <ChevronRight size={16} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  orderCode: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  address: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  itemCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
