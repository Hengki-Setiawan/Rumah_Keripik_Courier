import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STEPS = [
  { title: 'Selamat Datang Kurir!', desc: 'Aplikasi ini untuk membantu kamu mengantar pesanan Rumah Keripik dengan mudah.' },
  { title: 'Terima Pesanan', desc: 'Kamu akan menerima notifikasi saat ada pesanan baru. Accept dalam 45 detik atau akan otomatis di-reassign.' },
  { title: 'Antar ke Pelanggan', desc: 'Ikuti peta, kirim lokasi real-time, dan pastikan paket sampai dengan aman.' },
  { title: 'Bukti Pengiriman', desc: 'Ambil foto dan tanda tangan sebagai bukti pengiriman. Status akan terkirim otomatis.' },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);

  async function handleNext() {
    if (step < STEPS.length - 1) { setStep(step + 1); }
    else {
      await AsyncStorage.setItem('onboarding_done', 'true');
      router.replace('/');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.content}>
        <View style={styles.dots}>
          {STEPS.map((_, i) => <View key={i} style={[styles.dot, i === step && styles.activeDot]} />)}
        </View>
        <Text style={styles.title}>{STEPS[step].title}</Text>
        <Text style={styles.desc}>{STEPS[step].desc}</Text>
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>{step < STEPS.length - 1 ? 'Lanjut' : 'Mulai'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf6ef' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  dots: { flexDirection: 'row', gap: 8, marginBottom: 48 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ddd' },
  activeDot: { backgroundColor: '#c55a2b', width: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  desc: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24, marginBottom: 48 },
  button: { backgroundColor: '#c55a2b', paddingHorizontal: 48, paddingVertical: 16, borderRadius: 12 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
