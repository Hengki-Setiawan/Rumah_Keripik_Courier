import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';
import StatusBadge from './StatusBadge';

interface DeliveryCardProps {
  id: number;
  customerName: string;
  address: string;
  status: string;
  isCod?: boolean;
  codAmount?: number;
  distance?: string;
  routeOrder?: number;
  onPress?: () => void;
}

export default function DeliveryCard({
  customerName, address, status, isCod, codAmount, distance, routeOrder, onPress,
}: DeliveryCardProps) {
  const isActive = status === 'Dalam_Pengiriman' || status === 'in_transit';

  return (
    <TouchableOpacity
      style={[styles.card, isActive && styles.cardActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {routeOrder != null && (
            <View style={styles.orderBadge}>
              <Text style={styles.orderText}>{routeOrder}</Text>
            </View>
          )}
          <Text style={styles.name} numberOfLines={1}>{customerName}</Text>
        </View>
        <StatusBadge status={status} />
      </View>
      <Text style={styles.address} numberOfLines={2}>{address}</Text>
      <View style={styles.footer}>
        {distance && <Text style={styles.distance}>{distance}</Text>}
        {isCod && codAmount != null && (
          <Text style={styles.cod}>COD: Rp {codAmount.toLocaleString('id-ID')}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardActive: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  orderBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  address: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distance: {
    fontSize: 12,
    color: colors.textMuted,
  },
  cod: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
});
