import { View, Text, StyleSheet } from 'react-native';
import { useAppColors, spacing, borderRadius } from '../../theme';

interface StatCardProps {
  value: string | number;
  label: string;
  color?: string;
  icon?: React.ReactNode;
}

export function StatCard({ value, label, color, icon }: StatCardProps) {
  const colors = useAppColors();
  const accentColor = color ?? colors.accent;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderLeftColor: accentColor,
        },
      ]}
    >
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderLeftWidth: 3,
    alignItems: 'center',
    gap: 4,
  },
  iconWrap: {
    marginBottom: 2,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
