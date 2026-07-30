import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useAppColors, spacing, borderRadius } from '../../theme';

interface GlassCameraOverlayProps {
  frameLabel?: string;
  showFrame?: boolean;
}

export function GlassCameraOverlay({
  frameLabel = 'Letakkan barang di dalam bingkai',
  showFrame = true,
}: GlassCameraOverlayProps) {
  const colors = useAppColors();
  const isDark = colors.bg === '#1a1613';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {showFrame && (
        <>
          <View style={[styles.frameCorner, styles.topLeft, { borderColor: colors.accent }]} />
          <View style={[styles.frameCorner, styles.topRight, { borderColor: colors.accent }]} />
          <View style={[styles.frameCorner, styles.bottomLeft, { borderColor: colors.accent }]} />
          <View style={[styles.frameCorner, styles.bottomRight, { borderColor: colors.accent }]} />
        </>
      )}
      <BlurView
        intensity={40}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.labelBar,
          {
            backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)',
          },
        ]}
      >
        <Text style={[styles.labelText, { color: colors.white }]}>{frameLabel}</Text>
      </BlurView>
    </View>
  );
}

const CORNER_SIZE = 40;
const CORNER_BORDER = 4;

const styles = StyleSheet.create({
  frameCorner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderWidth: 0,
  },
  topLeft: {
    top: 40,
    left: 20,
    borderTopWidth: CORNER_BORDER,
    borderLeftWidth: CORNER_BORDER,
  },
  topRight: {
    top: 40,
    right: 20,
    borderTopWidth: CORNER_BORDER,
    borderRightWidth: CORNER_BORDER,
  },
  bottomLeft: {
    bottom: 100,
    left: 20,
    borderBottomWidth: CORNER_BORDER,
    borderLeftWidth: CORNER_BORDER,
  },
  bottomRight: {
    bottom: 100,
    right: 20,
    borderBottomWidth: CORNER_BORDER,
    borderRightWidth: CORNER_BORDER,
  },
  labelBar: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    overflow: 'hidden',
  },
  labelText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});
