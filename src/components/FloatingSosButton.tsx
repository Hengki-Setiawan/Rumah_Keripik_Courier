import { Platform } from 'react-native';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ShieldAlert } from 'lucide-react-native';
import { useAppColors, borderRadius, spacing } from '../theme';

export function FloatingSosButton() {
  const colors = useAppColors();
  return (
    <TouchableOpacity
      style={[styles.floatingBtn, { backgroundColor: colors.error }]}
      onPress={() => {
        if (Platform.OS !== 'web') {
          import('expo-haptics').then((Haptics) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
          });
        }
        router.push('/sos');
      }}
      activeOpacity={0.8}
    >
      <ShieldAlert size={18} color="#fff" />
      <Text style={styles.floatingText}>SOS</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  floatingBtn: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xxl + 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    elevation: 6,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    zIndex: 999,
  },
  floatingText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
