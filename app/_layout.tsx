import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
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
      </Stack>
    </SafeAreaProvider>
  );
}
