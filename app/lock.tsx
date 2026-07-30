import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Lock, Fingerprint, ShieldCheck } from 'lucide-react-native';
import { useAppColors, spacing, borderRadius } from '../src/theme';
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

function AnimatedPinDot({ active, index, error }: { active: boolean; index: number; error: boolean }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (active) {
      scale.value = withSequence(
        withSpring(1.3, { stiffness: 200, damping: 8 }),
        withSpring(1, { stiffness: 200, damping: 8 }),
      );
    }
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const dotColor = error ? '#ef4444' : active ? '#c55a2b' : '#d1d5db';
  const dotSize = active ? 14 : 10;

  return (
    <Animated.View
      entering={FadeInUp.duration(200).delay(index * 60)}
      style={[
        styles.pinDot,
        {
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: dotColor,
        },
        animatedStyle,
      ]}
    />
  );
}

export default function LockScreen() {
  const colors = useAppColors();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinExists, setPinExists] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [step, setStep] = useState<'initial' | 'setup_new' | 'confirm_new' | 'unlock'>('initial');
  const [error, setError] = useState(false);
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
      router.replace('/(tabs)' as any);
    }
  }

  function handlePinInput(value: string) {
    setError(false);
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
          router.replace('/(tabs)' as any);
        } else {
          setError(true);
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
      router.replace('/(tabs)' as any);
    } else {
      setError(true);
      setPin('');
    }
  }

  function handleSkip() {
    router.replace('/(tabs)' as any);
  }

  function handleDelete() {
    setPin('');
    setError(false);
  }

  const getStepTitle = () => {
    switch (step) {
      case 'initial': return 'Amankan Aplikasi';
      case 'setup_new': return 'Buat PIN (6 digit)';
      case 'confirm_new': return 'Ketik Ulang PIN';
      case 'unlock': return 'Masukkan PIN';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'initial': return 'Lindungi akses kurir dengan PIN';
      case 'setup_new': return 'Masukkan 6 digit PIN baru';
      case 'confirm_new': return 'Masukkan PIN sekali lagi';
      case 'unlock': return 'Ketik PIN untuk membuka aplikasi';
    }
  };

  const displayPin = step === 'confirm_new' ? confirmPin : pin;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        {/* Glass Card */}
        <BlurView
          intensity={50}
          tint={colors.bg === '#1a1613' ? 'dark' : 'light'}
          style={[
            styles.glassCard,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface + '70',
            },
          ]}
        >
          {/* Icon */}
          <Animated.View entering={ZoomIn.duration(400).springify().damping(12)}>
            <View style={[styles.iconCircle, { backgroundColor: colors.accentLight }]}>
              {step === 'unlock' ? (
                <Lock size={36} color={colors.accent} />
              ) : (
                <ShieldCheck size={36} color={colors.accent} />
              )}
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.Text
            entering={FadeInUp.duration(300).delay(100)}
            style={[styles.title, { color: colors.text }]}
          >
            {getStepTitle()}
          </Animated.Text>
          <Animated.Text
            entering={FadeInUp.duration(300).delay(150)}
            style={[styles.subtitle, { color: colors.textSecondary }]}
          >
            {getStepSubtitle()}
          </Animated.Text>

          {/* Animated Dots */}
          <Animated.View
            entering={FadeInUp.duration(300).delay(200)}
            style={styles.dotsRow}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <AnimatedPinDot
                key={i}
                index={i}
                active={i < displayPin.length}
                error={error}
              />
            ))}
          </Animated.View>

          {/* Error message */}
          {error && (
            <Animated.Text
              entering={FadeIn.duration(200)}
              style={[styles.errorText, { color: colors.error }]}
            >
              {step === 'confirm_new' ? 'PIN tidak cocok. Coba lagi.' : 'PIN salah. Coba lagi.'}
            </Animated.Text>
          )}
        </BlurView>

        {/* Hidden Input */}
        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={displayPin}
          onChangeText={handlePinInput}
          keyboardType="number-pad"
          maxLength={6}
          secureTextEntry
          autoFocus
        />

        {/* Actions */}
        <View style={styles.actions}>
          {step === 'unlock' && biometricAvailable && (
            <TouchableOpacity
              style={[styles.biometricBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleBiometric}
              activeOpacity={0.7}
              accessibilityLabel="Buka dengan sidik jari atau Face ID"
              accessibilityRole="button"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Fingerprint size={20} color={colors.accent} />
              <Text style={[styles.biometricText, { color: colors.accent }]}>Sidik Jari / Face ID</Text>
            </TouchableOpacity>
          )}

          {step === 'initial' && (
            <>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
                onPress={() => { setStep('setup_new'); setPin(''); setError(false); }}
                activeOpacity={0.8}
                accessibilityLabel="Buat PIN baru"
                accessibilityRole="button"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.primaryBtnText}>Buat PIN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.skipBtn}
                onPress={handleSkip}
                activeOpacity={0.7}
                accessibilityLabel="Lewati pengaturan PIN"
                accessibilityRole="button"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[styles.skipBtnText, { color: colors.textSecondary }]}>Lewati</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'unlock' && (
            <TouchableOpacity
              style={[styles.deleteBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleDelete}
              activeOpacity={0.7}
              accessibilityLabel="Hapus PIN"
              accessibilityRole="button"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.deleteBtnText, { color: colors.textSecondary }]}>Hapus</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  glassCard: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    paddingVertical: spacing.xxl + 8,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
  },
  pinDot: {},
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.xxl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  primaryBtn: {
    borderRadius: borderRadius.md,
    paddingHorizontal: 48,
    paddingVertical: spacing.md,
    minWidth: 200,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipBtn: {
    padding: spacing.md,
  },
  skipBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  deleteBtn: {
    borderRadius: borderRadius.md,
    paddingHorizontal: 48,
    paddingVertical: spacing.md,
    borderWidth: 1,
    minWidth: 200,
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  biometricBtn: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    paddingHorizontal: 32,
    paddingVertical: spacing.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minWidth: 200,
    minHeight: 48,
  },
  biometricText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
