import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { spacing } from '../../src/theme';
const PRIMARY_COLOR = '#c55a2b';
import { getToken } from '../../src/lib/storage';
import * as Location from 'expo-location';

const SOS_CONTACTS = process.env.EXPO_PUBLIC_SOS_PHONE || '08123456789';

export default function SosScreen() {
  const [sending, setSending] = useState(false);

  async function handleSos() {
    setSending(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let location = null;
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        location = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      }
      const token = await getToken();
      await fetch('https://rumah-keripik.vercel.app/api/courier/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify({ location, timestamp: new Date().toISOString() }),
      });
      Alert.alert('SOS Terkirim', 'Bantuan sudah dalam perjalanan. Admin akan menghubungi kamu segera.');
      router.back();
    } catch {
      Alert.alert('Gagal', 'Tidak dapat mengirim sinyal SOS. Coba hubungi admin langsung di ' + SOS_CONTACTS);
    } finally { setSending(false); }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'SOS Darurat', headerShown: true }} />
      <View style={styles.content}>
        <Text style={styles.title}>SOS Darurat</Text>
        <Text style={styles.subtitle}>Kirim sinyal bantuan ke admin</Text>
        <TouchableOpacity style={[styles.sosButton, sending && styles.disabled]} onPress={handleSos} disabled={sending} activeOpacity={0.7}>
          <Text style={styles.sosText}>SOS</Text>
        </TouchableOpacity>
        {sending && <Text style={styles.sending}>Mengirim sinyal...</Text>}
        <Text style={styles.info}>Lokasi kamu akan dikirim ke admin untuk tindakan cepat.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: spacing.sm },
  subtitle: { fontSize: 16, color: '#666', marginBottom: spacing.xl },
  sosButton: { width: 160, height: 160, borderRadius: 80, backgroundColor: '#dc2626', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xl, elevation: 8, shadowColor: '#dc2626', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  sosText: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  disabled: { opacity: 0.6 },
  sending: { fontSize: 14, color: PRIMARY_COLOR, marginBottom: spacing.md },
  info: { fontSize: 14, color: '#888', textAlign: 'center', paddingHorizontal: spacing.xl },
});
