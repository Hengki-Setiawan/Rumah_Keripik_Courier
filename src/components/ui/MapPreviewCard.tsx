import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';

interface MapPreviewCardProps {
  destinationLat: number;
  destinationLng: number;
  courierLat?: number;
  courierLng?: number;
  address?: string;
  distance?: string;
  eta?: string;
  onPress?: () => void;
}

export default function MapPreviewCard({
  destinationLat,
  destinationLng,
  courierLat,
  courierLng,
  address,
  distance,
  eta,
  onPress,
}: MapPreviewCardProps) {
  const staticMapUrl = Platform.select({
    ios: `https://maps.apple.com/?daddr=${destinationLat},${destinationLng}${courierLat && courierLng ? `&saddr=${courierLat},${courierLng}` : ''}`,
    default: `https://www.google.com/maps/dir/${courierLat && courierLng ? `${courierLat},${courierLng}/` : ''}${destinationLat},${destinationLng}`,
  });

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapIcon}>🗺️</Text>
        <Text style={styles.mapHint}>Ketuk untuk buka peta</Text>
      </View>
      {address && <Text style={styles.address} numberOfLines={2}>{address}</Text>}
      {(distance || eta) && (
        <View style={styles.infoRow}>
          {distance && <Text style={styles.infoText}>{distance}</Text>}
          {eta && <Text style={styles.infoText}>ETA: {eta}</Text>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapPlaceholder: {
    height: 140,
    backgroundColor: colors.surfaceDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapIcon: {
    fontSize: 32,
  },
  mapHint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  address: {
    fontSize: 14,
    color: colors.text,
    padding: spacing.md,
    paddingBottom: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  infoText: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
