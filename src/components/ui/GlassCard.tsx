import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { BlurView } from 'expo-blur';
import { useAppColors, spacing, borderRadius } from '../../theme';

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  borderColor?: string;
  noPadding?: boolean;
}

export function GlassCard({
  children,
  style,
  intensity = 60,
  tint,
  borderColor,
  noPadding,
}: GlassCardProps) {
  const colors = useAppColors();
  const isDark = colors.bg === '#1a1613';
  const effectiveTint = tint ?? (isDark ? 'dark' : 'light');

  return (
    <BlurView
      intensity={intensity}
      tint={effectiveTint}
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(37,32,27,0.7)' : 'rgba(255,250,244,0.7)',
          borderColor: borderColor ?? colors.border,
        },
        !noPadding && styles.padded,
        style,
      ]}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  padded: {
    padding: spacing.xl,
  },
});
