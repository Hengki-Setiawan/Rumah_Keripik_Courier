import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAppColors, spacing, borderRadius } from '../../src/theme';

const STEPS = [
  { title: 'Selamat Datang Kurir!', desc: 'Aplikasi ini untuk membantu kamu mengantar pesanan Rumah Keripik dengan mudah.' },
  { title: 'Terima Pesanan', desc: 'Kamu akan menerima notifikasi saat ada pesanan baru.' },
  { title: 'Antar ke Pelanggan', desc: 'Ikuti peta, kirim lokasi real-time, dan pastikan paket sampai dengan aman.' },
  { title: 'Bukti Pengiriman', desc: 'Ambil foto dan tanda tangan sebagai bukti pengiriman.' },
];

export default function OnboardingScreen() {
  const colors = useAppColors();
  const [step, setStep] = useState(0);

  async function handleNext() {
    if (step < STEPS.length - 1) { setStep(step + 1); }
    else {
      await AsyncStorage.setItem('onboarding_done', 'true');
      router.replace('/login');
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.content}>
        <View style={styles.dots}>
          {STEPS.map((_, i) => <View key={i} style={[styles.dot, i === step && { backgroundColor: colors.accent, width: 24 }]} />)}
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{STEPS[step].title}</Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]}>{STEPS[step].desc}</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={handleNext}>
          <Text style={styles.buttonText}>{step < STEPS.length - 1 ? 'Lanjut' : 'Mulai'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  dots: { flexDirection: 'row', gap: 8, marginBottom: 48 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ddd' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  desc: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 48 },
  button: { paddingHorizontal: 48, paddingVertical: 16, borderRadius: 12 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
