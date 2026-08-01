import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, BatteryFull, Lock, Info, HelpCircle } from 'lucide-react-native';

import { useAppColors, spacing, borderRadius } from '../../src/theme';
import { GlassCard } from '../../src/components/ui/GlassCard';

const SETTINGS_ITEMS = [
  { label: 'Optimasi Baterai', desc: 'Panduan prevent battery kill HP Android', icon: BatteryFull, route: '/battery-guide' },
  { label: 'Keamanan PIN', desc: 'Atur PIN aplikasi & biometric lock', icon: Lock, route: '/lock' },
  { label: 'Tentang Aplikasi', desc: 'Versi 1.0.0 — Rumah Keripik Courier', icon: Info, route: null },
  { label: 'Bantuan', desc: 'Hubungi admin jika ada kendala', icon: HelpCircle, route: null },
];

export default function SettingsScreen() {
  const colors = useAppColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Pengaturan',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        {SETTINGS_ITEMS.map((item, i) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.selectionAsync().catch(() => undefined);
                }
                if (item.route) router.push(item.route as any);
              }}
              activeOpacity={0.7}
              disabled={!item.route}
            >
              <GlassCard noPadding>
                <View style={styles.cardInner}>
                  <View style={[styles.iconBox, { backgroundColor: colors.accentLight }]}>
                    <Icon size={22} color={colors.accent} />
                  </View>
                  <View style={styles.textBox}>
                    <Text style={[styles.label, { color: colors.text }]}>{item.label}</Text>
                    <Text style={[styles.desc, { color: colors.textMuted }]}>{item.desc}</Text>
                  </View>
                  <ArrowLeft size={16} color={colors.textMuted} style={{ transform: [{ rotate: '180deg' }] }} />
                </View>
              </GlassCard>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.md },
  cardInner: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.lg, gap: spacing.md,
  },
  iconBox: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  textBox: { flex: 1 },
  label: { fontSize: 15, fontWeight: '700' },
  desc: { fontSize: 12, marginTop: 2 },
});
