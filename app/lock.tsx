import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../src/theme';
import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'courier_app_pin';

async function getAppPin(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(PIN_KEY);
  } catch {
    return null;
  }
}

async function setAppPin(pin: string): Promise<void> {
  await SecureStore.setItemAsync(PIN_KEY, pin);
}

export default function LockScreen() {
  const [pin, setPin] = useState('');
  const [mode, setMode] = useState<'setup' | 'unlock' | 'verify'>('unlock');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinExists, setPinExists] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [step, setStep] = useState<'initial' | 'setup_new' | 'confirm_new' | 'unlock'>('initial');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    checkState();
    inputRef.current?.focus();
  }, []);

  async function checkState() {
    const existing = await getAppPin();
    setPinExists(existing !== null);
    setStep(existing ? 'unlock' : 'initial');

    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(compatible && enrolled);
  }

  async function handleBiometric() {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Buka aplikasi kurir',
      fallbackLabel: 'Gunakan PIN',
    });
    if (result.success) {
      router.replace('/');
    }
  }

  function handlePinInput(value: string) {
    if (step === 'setup_new') {
      setPin(value);
      if (value.length === 6) {
        setStep('confirm_new');
        setConfirmPin('');
      }
    } else if (step === 'confirm_new') {
      setConfirmPin(value);
      if (value.length === 6) {
        if (value === pin) {
          setAppPin(value);
          Alert.alert('PIN tersimpan', 'PIN aplikasi berhasil dibuat.');
          router.replace('/');
        } else {
          Alert.alert('PIN tidak cocok', 'Ketik ulang PIN baru.');
          setStep('setup_new');
          setPin('');
        }
      }
    } else if (step === 'unlock') {
      setPin(value);
      if (value.length === 6) {
        verifyPin(value);
      }
    }
  }

  async function verifyPin(input: string) {
    const stored = await getAppPin();
    if (stored && input === stored) {
      router.replace('/');
    } else {
      Alert.alert('PIN salah', 'Coba lagi');
      setPin('');
    }
  }

  function handleSkip() {
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>
          {step === 'unlock' ? '' : '🔐'}
        </Text>
        <Text style={styles.title}>
          {step === 'initial' ? 'Amankan Aplikasi' :
           step === 'setup_new' ? 'Buat PIN (6 digit)' :
           step === 'confirm_new' ? 'Ketik Ulang PIN' :
           'Masukkan PIN'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'initial' ? 'Lindungi akses kurir dengan PIN' :
           step === 'unlock' ? 'Ketik PIN untuk membuka aplikasi' : ''}
        </Text>

        <View style={styles.dots}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                ((step === 'setup_new' && i < pin.length) ||
                 (step === 'confirm_new' && i < confirmPin.length) ||
                 (step === 'unlock' && i < pin.length))
                  ? styles.dotFilled
                  : null,
              ]}
            />
          ))}
        </View>

        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={step === 'confirm_new' ? confirmPin : pin}
          onChangeText={handlePinInput}
          keyboardType="number-pad"
          maxLength={6}
          secureTextEntry
          autoFocus
        />

        <View style={styles.actions}>
          {step === 'unlock' && biometricAvailable && (
            <TouchableOpacity style={styles.biometricBtn} onPress={handleBiometric}>
              <Text style={styles.biometricText}>🔏 Sidik Jari / Face ID</Text>
            </TouchableOpacity>
          )}
          {step === 'initial' && (
            <>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => { setStep('setup_new'); setPin(''); }}>
                <Text style={styles.primaryBtnText}>Buat PIN</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
                <Text style={styles.skipBtnText}>Lewati</Text>
              </TouchableOpacity>
            </>
          )}
          {step === 'unlock' && (
            <TouchableOpacity style={styles.skipBtn} onPress={() => { setPin(''); }}>
              <Text style={styles.skipBtnText}>Hapus</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center' },
  content: { alignItems: 'center', paddingHorizontal: spacing.xl },
  icon: { fontSize: 60, marginBottom: spacing.lg },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  dots: { flexDirection: 'row', gap: spacing.md, marginVertical: spacing.xxl },
  dot: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#e5e7eb', borderWidth: 2, borderColor: '#d1d5db',
  },
  dotFilled: { backgroundColor: colors.accent, borderColor: colors.accent },
  hiddenInput: {
    position: 'absolute', width: 1, height: 1, opacity: 0,
  },
  actions: { gap: spacing.md, marginTop: spacing.lg },
  primaryBtn: {
    backgroundColor: colors.accent, borderRadius: borderRadius.md,
    paddingHorizontal: 48, paddingVertical: spacing.md,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  skipBtn: { padding: spacing.md },
  skipBtnText: { color: colors.textSecondary, fontSize: 14 },
  biometricBtn: {
    backgroundColor: '#f0f5ff', borderRadius: borderRadius.md,
    paddingHorizontal: 32, paddingVertical: spacing.md,
    borderWidth: 1, borderColor: '#dbeafe',
  },
  biometricText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
});
