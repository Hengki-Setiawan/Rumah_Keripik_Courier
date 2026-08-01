import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  accentColor?: string;
}

export default function Card({ children, style, accentColor }: CardProps) {
  return (
    <View style={[styles.card, accentColor ? { borderLeftWidth: 3, borderLeftColor: accentColor } : {}, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
