import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import NetInfo from '@react-native-community/netinfo';
import { processQueue } from '../src/lib/offline-queue';
import { initSentry } from '../src/lib/sentry';

initSentry();

function OfflineQueueProcessor() {
  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        processQueue();
      }
    });
    return () => unsub();
  }, []);
  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <OfflineQueueProcessor />
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="lock" />
          <Stack.Screen name="login" />
          <Stack.Screen name="index" />
          <Stack.Screen name="delivery/[id]" />
          <Stack.Screen name="delivery/[id]/map" />
          <Stack.Screen name="delivery/[id]/proof" />
          <Stack.Screen name="delivery/[id]/success" />
          <Stack.Screen name="delivery/[id]/fail" />
          <Stack.Screen name="history" />
          <Stack.Screen name="earnings/index" />
          <Stack.Screen name="sos/index" />
          <Stack.Screen name="shift/index" />
          <Stack.Screen name="incidents/index" />
          <Stack.Screen name="notifications/index" />
          <Stack.Screen name="stats/index" />
          <Stack.Screen name="route/today" />
          <Stack.Screen name="profile" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
