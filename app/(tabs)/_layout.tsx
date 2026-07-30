import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Tabs, usePathname, router } from 'expo-router';
import { BlurView } from 'expo-blur';
import {
  LayoutDashboard,
  History,
  BarChart3,
  User,
} from 'lucide-react-native';
import { useAppColors, spacing, borderRadius } from '../../src/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_ICON_SIZE = 22;

function DashboardIcon({ focused, color }: { focused: boolean; color: string }) {
  return <LayoutDashboard size={TAB_ICON_SIZE} color={color} />;
}

function HistoryIcon({ focused, color }: { focused: boolean; color: string }) {
  return <History size={TAB_ICON_SIZE} color={color} />;
}

function StatsIcon({ focused, color }: { focused: boolean; color: string }) {
  return <BarChart3 size={TAB_ICON_SIZE} color={color} />;
}

function ProfileIcon({ focused, color }: { focused: boolean; color: string }) {
  return <User size={TAB_ICON_SIZE} color={color} />;
}

function GlassTabBar() {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  const tabs = [
    { name: 'index', title: 'Dashboard', icon: DashboardIcon, route: '/(tabs)' as const },
    { name: 'history', title: 'Riwayat', icon: HistoryIcon, route: '/(tabs)/history' as const },
    { name: 'stats', title: 'Performa', icon: StatsIcon, route: '/(tabs)/stats' as const },
    { name: 'profile', title: 'Profil', icon: ProfileIcon, route: '/(tabs)/profile' as const },
  ];

  const currentTab = pathname;
  const isDark = colors.bg === '#1a1613';

  return (
    <View style={[styles.tabBarOuter, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <BlurView
        intensity={80}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.tabBarBlur,
          {
            backgroundColor: isDark ? 'rgba(26,22,19,0.85)' : 'rgba(250,246,239,0.85)',
            borderColor: colors.border,
          },
        ]}
      >
        {tabs.map((tab) => {
          const isActive = tab.name === 'index'
            ? currentTab === '/(tabs)' || currentTab === '/'
            : currentTab === tab.route;
          return (
            <TouchableOpacity
              key={tab.name}
              style={[
                styles.tabItem,
                isActive && { backgroundColor: isDark ? colors.accentLight + '80' : colors.accentLight },
              ]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  import('expo-haptics').then((H) =>
                    H.impactAsync(H.ImpactFeedbackStyle.Light).catch(() => {}),
                  );
                }
                router.push(tab.route as any);
              }}
              activeOpacity={0.7}
              accessibilityLabel={tab.title}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <tab.icon focused={isActive} color={isActive ? colors.accent : colors.textMuted} />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? colors.accent : colors.textMuted,
                    fontWeight: isActive ? '800' : '600',
                  },
                ]}
              >
                {tab.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={() => <GlassTabBar />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="stats" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarOuter: {
    paddingHorizontal: spacing.md,
    paddingTop: 0,
  },
  tabBarBlur: {
    flexDirection: 'row',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    gap: 2,
    minHeight: 44,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: -0.2,
  },
});
