import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import * as Location from 'expo-location';
import { colors, spacing, borderRadius } from '../../src/theme';
import { getToken } from '../../src/lib/storage';

export default function SosScreen() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSos() {
    Alert.alert('Kirim Sinyal Darurat?', 'Lokasi Anda akan dikirim ke admin untuk tindakan lanjutan.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Kirim Darurat', style: 'destructive', onPress: sendSos },
    ]);
  }

  async function sendSos() {
    setSending(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Lokasi', 'Aktifkan izin lokasi untuk mengirim sinyal darurat');
        setSending(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const token = await getToken();
      await fetch('https://rumah-keripik.vercel.app/api/courier/sos', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: loc.coords.latitude, lng: loc.coords.longitude }),
      });
      setSent(true);
      Alert.alert('Sinyal Terkirim', 'Admin sudah diberitahu. Tim akan menghubungi Anda segera.');
    } catch (err) {
      Alert.alert('Gagal', 'Tidak dapat mengirim sinyal darurat. Hubungi admin langsung.');
    } finally {
      setSending(false);
    }
  }

  function callEmergency() {
    Linking.openURL('tel:112');
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Darurat', headerShown: true, headerStyle: { backgroundColor: '#faf6ef' }, headerTintColor: '#333' }} />
      <View style={styles.content}>
        {sent ? (
          <View style={styles.sentContainer}>
            <Text style={styles.sentIcon}>✓</Text>
            <Text style={styles.sentTitle}>Sinyal Darurat Terkirim</Text>
            <Text style={styles.sentDesc}>Admin sudah mendapatkan lokasi Anda dan akan menghubungi Anda sesegera mungkin.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.instruction}>Jika Anda dalam situasi darurat atau tidak aman, tekan tombol di bawah untuk mengirim sinyal ke admin.</Text>
            <TouchableOpacity style={styles.sosButton} onPress={handleSos} disabled={sending}>
              {sending ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : (
                <Text style={styles.sosText}>SOS</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.sosHint}>Lokasi Anda akan dikirim ke admin</Text>

            <TouchableOpacity style={styles.callButton} onPress={callEmergency}>
              <Text style={styles.callText}>Hubungi Darurat (112)</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf6ef' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  instruction: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  sosButton: {
    width: 160, height: 160, borderRadius: 80, backgroundColor: '#d32f2f',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#d32f2f', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
    elevation: 8,
  },
  sosText: { color: '#fff', fontSize: 42, fontWeight: '800' },
  sosHint: { fontSize: 12, color: '#999', marginTop: 12 },
  callButton: { marginTop: 40, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, borderWidth: 1, borderColor: '#d32f2f' },
  callText: { color: '#d32f2f', fontSize: 16, fontWeight: '600' },
  sentContainer: { alignItems: 'center' },
  sentIcon: { fontSize: 48, color: '#2e7d32', marginBottom: 16 },
  sentTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 8 },
  sentDesc: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
});
