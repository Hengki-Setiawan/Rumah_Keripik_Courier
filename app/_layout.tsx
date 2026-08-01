import { useEffect, useRef } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Appearance, ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as Notifications from 'expo-notifications';
import { processQueue } from '../src/lib/offline-queue';
import { processSyncQueue } from '../src/db/sync-queue';
import { initSentry } from '../src/lib/sentry';
import { installErrorLogging } from '../src/lib/logger';
import { QueryProvider } from '../src/query/provider';
import { useSyncStore } from '../src/store/sync-store';
import { AuthProvider, useAuth } from '../src/lib/auth-guard';

initSentry();
installErrorLogging();

const THEME_KEY = 'courier_theme_pref';

const DEEP_LINK_MAP: Record<string, string> = {
  new_delivery: '/delivery/',
  delivery_reminder: '/delivery/',
  shift_reminder: '/shift',
  earnings_update: '/earnings',
  sos_confirmation: '/sos',
  admin_broadcast: '/notifications',
  incident_ack: '/incidents',
};

function handleNotificationResponse(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data as Record<string, any>;
  const type = String(data?.type || '');
  const route = DEEP_LINK_MAP[type];
  if (route) {
    if (data?.deliveryId) {
      router.push(`${route}${data.deliveryId}` as any);
    } else {
      router.push(route as any);
    }
  }
}

function SyncProcessor() {
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((v) => {
      if (v === 'dark' || v === 'light') {
        Appearance.setColorScheme(v);
      }
    });

    const notifResponseSub = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    const unsub = NetInfo.addEventListener((state) => {
      useSyncStore.getState().setOnline(state.isConnected ?? true);
      if (state.isConnected) {
        processQueue();
        processSyncQueue();
      }
    });

    const interval = setInterval(async () => {
      const netState = await NetInfo.fetch();
      if (netState.isConnected) {
        processSyncQueue();
      }
    }, 60000);

    return () => {
      unsub();
      clearInterval(interval);
      notifResponseSub.remove();
    };
  }, []);
  return null;
}

function RootLayoutInner() {
  const { authState } = useAuth();

  if (authState === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#faf6ef' }}>
        <ActivityIndicator size="large" color="#c55a2b" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {authState === 'authenticated' ? (
        [
          <Stack.Screen key="tabs" name="(tabs)" />,
          <Stack.Screen key="delivery" name="delivery/[id]" />,
          <Stack.Screen key="delivery-map" name="delivery/[id]/map" />,
          <Stack.Screen key="delivery-proof" name="delivery/[id]/proof" />,
          <Stack.Screen key="delivery-success" name="delivery/[id]/success" />,
          <Stack.Screen key="delivery-fail" name="delivery/[id]/fail" />,
          <Stack.Screen key="earnings" name="earnings/index" />,
          <Stack.Screen key="sos" name="sos/index" />,
          <Stack.Screen key="shift" name="shift/index" />,
          <Stack.Screen key="incidents" name="incidents/index" />,
          <Stack.Screen key="notifications" name="notifications/index" />,
          <Stack.Screen key="route" name="route/today" />,
          <Stack.Screen key="battery-guide" name="battery-guide" />,
          <Stack.Screen key="lock" name="lock" />,
          <Stack.Screen key="settings" name="settings/index" />,
        ]
      ) : (
        <Stack.Screen name="(auth)" />
      )}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <QueryProvider>
            <SyncProcessor />
            <StatusBar style="dark" />
            <RootLayoutInner />
          </QueryProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
