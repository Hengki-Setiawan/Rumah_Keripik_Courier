import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useAppColors, spacing, borderRadius } from '../theme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadiusVal?: number;
  style?: object;
}

export function SkeletonLoader({ width = '100%', height = 20, borderRadiusVal = borderRadius.md, style }: SkeletonLoaderProps) {
  const colors = useAppColors();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: borderRadiusVal,
          backgroundColor: colors.surfaceDark,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  const colors = useAppColors();
  return (
    <View style={[skStyles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <SkeletonLoader width="60%" height={14} />
      <View style={{ height: spacing.sm }} />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLoader
          key={i}
          width={i === lines - 1 ? '40%' : '100%'}
          height={12}
          style={{ marginBottom: spacing.xs }}
        />
      ))}
    </View>
  );
}

export function SkeletonStatGrid() {
  return (
    <View style={skStyles.statRow}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[skStyles.statItem, { backgroundColor: 'transparent' }]}>
          <SkeletonLoader width={32} height={32} borderRadiusVal={16} />
          <View style={{ height: spacing.xs }} />
          <SkeletonLoader width={40} height={24} />
          <View style={{ height: 2 }} />
          <SkeletonLoader width={50} height={10} />
        </View>
      ))}
    </View>
  );
}

const skStyles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
  },
});
