import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { useAppColors, spacing, borderRadius } from '../src/theme';

const brands = [
  {
    name: 'Xiaomi (HyperOS/MIUI)',
    steps: [
      'Buka Settings > Battery',
      'Ketuk "Battery Saver" atau "Battery & Performance"',
      'Pilih "No restrictions" untuk Kurir Rumah Keripik',
      'Settings > Apps > Manage Apps > Kurir Rumah Keripik > Battery Saver > No restrictions',
      'Settings > Permissions > Autostart > Aktifkan Kurir Rumah Keripik',
    ],
  },
  {
    name: 'Oppo (ColorOS)',
    steps: [
      'Buka Settings > Battery',
      'Ketuk "Power Saver" > "Power Saver Mode"',
      'Pastikan tidak aktif saat Kurir sedang kerja',
      'Settings > Apps > App Management > Kurir Rumah Keripik',
      'Aktifkan "Background Running" dan "Auto-Launch"',
    ],
  },
  {
    name: 'Vivo (Funtouch OS)',
    steps: [
      'Buka Settings > Battery',
      'Pilih "Background App Management"',
      'Temukan Kurir Rumah Keripik > Pilih "Allow Background"',
      'Settings > Apps > Kurir Rumah Keripik > Battery > "Background Power Saver" > Off',
    ],
  },
  {
    name: 'Samsung (One UI)',
    steps: [
      'Buka Settings > Apps > Kurir Rumah Keripik',
      'Battery > "Unrestricted"',
      'Settings > Battery > "Background usage limits"',
      'Pastikan "Put unused apps to sleep" tidak termasuk Kurir Rumah Keripik',
    ],
  },
  {
    name: 'Realme (Realme UI)',
    steps: [
      'Buka Settings > Battery',
      'Pilih "Background Freeze" dan nonaktifkan untuk Kurir Rumah Keripik',
      'Settings > Apps > Kurir Rumah Keripik > Battery > "Allow background"',
      'Settings > Permissions > Autostart > Aktifkan Kurir Rumah Keripik',
    ],
  },
];

export default function BatteryGuideScreen() {
  const colors = useAppColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: true, title: 'Optimasi Baterai', headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: colors.text }]}>Kenapa Ini Penting?</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Beberapa HP Android (Xiaomi, Oppo, Vivo, Realme) secara agresif mematikan aplikasi di background untuk
          menghemat baterai. Akibatnya, lokasi kurir tidak terkirim ke server. Ikuti panduan di bawah sesuai merek HP.
        </Text>

        {brands.map((brand, i) => (
          <View key={i} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.brandTitle, { color: colors.accent }]}>{brand.name}</Text>
            {brand.steps.map((step, j) => (
              <View key={j} style={styles.stepRow}>
                <Text style={[styles.stepNumber, { color: colors.textSecondary }]}>{j + 1}.</Text>
                <Text style={[styles.stepText, { color: colors.text }]}>{step}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.brandTitle, { color: colors.accent }]}>Tips Tambahan</Text>
          <View style={styles.stepRow}>
            <Text style={[styles.stepText, { color: colors.text }]}>
              {'\u2022'} Pastikan GPS di HP dalam mode "High Accuracy" (GPS + WiFi + Data Seluler){'\n'}
              {'\u2022'} Jangan aktifkan "Data Saver" atau "Battery Saver" saat shift{'\n'}
              {'\u2022'} Matikan Bluetooth dan NFC jika tidak dipakai{'\n'}
              {'\u2022'} Kurangi kecerahan layar untuk hemat baterai{'\n'}
              {'\u2022'} Bawa power bank untuk shift panjang
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backButtonText, { color: colors.accent }]}>Kembali</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl + 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: spacing.sm },
  description: { fontSize: 14, lineHeight: 20, marginBottom: spacing.xl },
  card: { borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1 },
  brandTitle: { fontSize: 16, fontWeight: '700', marginBottom: spacing.md },
  stepRow: { flexDirection: 'row', marginBottom: spacing.sm },
  stepNumber: { fontSize: 14, marginRight: spacing.sm, minWidth: 20 },
  stepText: { fontSize: 14, flex: 1, lineHeight: 20 },
  backButton: { alignItems: 'center', paddingVertical: spacing.lg },
  backButtonText: { fontSize: 16 },
});