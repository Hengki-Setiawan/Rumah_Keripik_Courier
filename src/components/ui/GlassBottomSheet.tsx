import { useMemo, type ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetScrollView, type BottomSheetProps } from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import { useAppColors, spacing, borderRadius } from '../../theme';

interface GlassBottomSheetProps extends Partial<BottomSheetProps> {
  snapPoints: (string | number)[];
  children: ReactNode;
  title?: string;
}

export function GlassBottomSheet({
  snapPoints,
  children,
  title,
  ...props
}: GlassBottomSheetProps) {
  const colors = useAppColors();
  const isDark = colors.bg === '#1a1613';

  return (
    <BottomSheet
      snapPoints={snapPoints}
      index={0}
      backgroundComponent={() => (
        <BlurView
          intensity={80}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.background,
            {
              backgroundColor: isDark ? 'rgba(37,32,27,0.85)' : 'rgba(255,250,244,0.85)',
              borderColor: colors.border,
            },
          ]}
        />
      )}
      handleIndicatorStyle={[
        styles.handle,
        { backgroundColor: isDark ? colors.textMuted : colors.borderHover },
      ]}
      {...props}
    >
      {title && (
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        </View>
      )}
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        {children}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    marginTop: spacing.sm,
  },
  titleRow: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  content: {
    padding: spacing.xl,
    paddingTop: spacing.sm,
  },
});
