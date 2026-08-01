import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin, Navigation } from 'lucide-react-native';
import { useAppColors, spacing, borderRadius } from '../../theme';

interface MapPreviewCardProps {
  destinationLat?: number | string | null;
  destinationLng?: number | string | null;
  destinationName?: string;
  distanceKm?: number | string | null;
  onPress: () => void;
}

export function MapPreviewCard({
  destinationName,
  distanceKm,
  onPress,
}: MapPreviewCardProps) {
  const colors = useAppColors();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.mapPlaceholder}>
        <MapPin size={24} color={colors.accent} />
        <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
          {destinationName ?? 'Lokasi Tujuan'}
        </Text>
      </View>
      {distanceKm != null && (
        <View style={styles.footer}>
          <Navigation size={13} color={colors.accent} style={{ marginRight: 4 }} />
          <Text style={[styles.distance, { color: colors.accent }]}>
            {typeof distanceKm === 'string' ? distanceKm : `${distanceKm}`} km — Tap untuk buka peta
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  mapPlaceholder: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  placeholderText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  distance: {
    fontSize: 12,
    fontWeight: '600',
  },
});
