import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, borderRadius } from '../src/theme';
import { login } from '../src/lib/api-client';
import { saveToken, saveCourierData } from '../src/lib/storage';
import { requestLocationPermissions } from '../src/lib/location';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (phone.length < 10) {
      return Alert.alert('Error', 'Nomor telepon tidak valid');
    }
    if (pin.length !== 6) {
      return Alert.alert('Error', 'PIN harus 6 digit');
    }

    setLoading(true);
    try {
      const data = await login(phone, pin);
      await saveToken(data.token);
      await saveCourierData(data.courier);

      const hasLocation = await requestLocationPermissions();
      if (!hasLocation) {
        Alert.alert('Info', 'Aktifkan izin lokasi untuk melacak pengiriman.');
      }

      router.replace('/');
    } catch (error: any) {
      Alert.alert('Login Gagal', error.message || 'Cek kembali phone dan PIN');
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.brand}>Rumah Keripik</Text>
          <Text style={styles.title}>Login Kurir</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Nomor Telepon</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="081234567890"
            keyboardType="phone-pad"
            autoCapitalize="none"
            editable={!loading}
          />

          <Text style={styles.label}>PIN (6 digit)</Text>
          <TextInput
            style={styles.input}
            value={pin}
            onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            keyboardType="number-pad"
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Masuk</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl + spacing.lg,
  },
  brand: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.bg,
    borderRadius: borderRadius.md,
    padding: spacing.md + 2,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    padding: spacing.md + 4,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
