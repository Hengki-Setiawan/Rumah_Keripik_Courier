import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, ClipboardList, ArrowLeft } from 'lucide-react-native';

import { useAppColors, spacing, borderRadius } from '../../../src/theme';
import { t } from '../../../src/i18n';

export default function SuccessScreen() {
  const colors = useAppColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.greenLight }]}>
          <CheckCircle2 size={40} color={colors.green} />
        </View>
        <Text style={[styles.title, { color: colors.green }]}>{t('delivery.success_title')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('delivery.successMessage')}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.accent }]}
            onPress={() => router.replace('/' as any)}
          >
            <ClipboardList size={18} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>{t('delivery.backToDashboard')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: spacing.xxl + spacing.xl,
    lineHeight: 22,
  },
  actions: {
    width: '100%',
    gap: spacing.md,
  },
  primaryButton: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    padding: spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
