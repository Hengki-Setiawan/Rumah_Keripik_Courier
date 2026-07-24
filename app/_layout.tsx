import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import NetInfo from '@react-native-community/netinfo';
import { processQueue } from '../src/lib/offline-queue';

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
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
