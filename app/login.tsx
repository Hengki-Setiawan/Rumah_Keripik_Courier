import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Store, Phone, KeyRound, ShieldAlert, ArrowRight } from 'lucide-react-native';

import { useAppColors, borderRadius, spacing } from '../src/theme';
import { login } from '../src/lib/api-client';
import { saveToken, saveCourierData } from '../src/lib/storage';

export default function LoginScreen() {
  const colors = useAppColors();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const shakeAnim = useRef(new Animated.Value(0)).current;

  function triggerShake() {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }

  function handlePhoneChange(val: string) {
    const cleaned = val.replace(/[^0-9]/g, '');
    setPhone(cleaned);
    setErrorMessage('');
  }

  function handlePinChange(val: string) {
    const cleaned = val.replace(/[^0-9]/g, '').slice(0, 6);
    setPin(cleaned);
    setErrorMessage('');
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => undefined);
    }
  }

  async function handleLogin() {
    setErrorMessage('');

    if (!phone || phone.length < 10) {
      const msg = 'Nomor HP wajib diisi minimal 10 digit';
      setErrorMessage(msg);
      triggerShake();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
      }
      return;
    }

    if (!pin || pin.length !== 6) {
      const msg = 'PIN wajib terdiri dari tepat 6 digit';
      setErrorMessage(msg);
      triggerShake();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
      }
      return;
    }

    setLoading(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    }

    try {
      const result = await login(phone, pin);
      const token = result.accessToken || result.token;
      if (!token) {
        throw new Error('Token autentikasi tidak diterima dari server');
      }

      await saveToken(token);
      await saveCourierData(result.courier);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      }
      router.replace('/');
    } catch (error) {
      const rawMsg = error instanceof Error ? error.message : 'Gagal terhubung ke server';
      let localizedMsg = rawMsg;

      if (rawMsg === 'UNAUTHORIZED' || rawMsg.includes('401') || rawMsg.includes('tidak valid')) {
        localizedMsg = 'Nomor HP atau PIN 6-digit tidak sesuai. Silakan periksa kembali.';
      } else if (rawMsg === 'NO_TOKEN') {
        localizedMsg = 'Sesi login telah berakhir. Silakan login kembali.';
      } else if (rawMsg === 'NETWORK_ERROR' || rawMsg.includes('fetch')) {
        localizedMsg = 'Koneksi internet bermasalah. Periksa jaringan HP Anda.';
      }

      setErrorMessage(localizedMsg);
      triggerShake();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <Animated.View
          style={[
            styles.content,
            { transform: [{ translateX: shakeAnim }] },
          ]}
        >
          {/* Header & Logo */}
          <View style={styles.header}>
            <View
              style={[
                styles.logoIconBg,
                { backgroundColor: colors.accentLight, borderColor: colors.border },
              ]}
            >
              <Store size={36} color={colors.accent} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Rumah Keripik</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Dashboard Aplikasi Kurir
            </Text>
          </View>

          {/* Form Card */}
          <View
            style={[
              styles.formCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            {/* Phone Field */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Nomor HP (WhatsApp)
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: colors.surfaceDark, borderColor: colors.border },
                ]}
              >
                <Phone size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="081234567890"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  value={phone}
                  onChangeText={handlePhoneChange}
                  maxLength={15}
                />
              </View>
            </View>

            {/* PIN Field */}
            <View style={styles.fieldGroup}>
              <View style={styles.pinHeaderRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  PIN Log-in (Wajib 6 Digit)
                </Text>
                <Text style={[styles.pinCountText, { color: pin.length === 6 ? colors.green : colors.textMuted }]}>
                  {pin.length}/6
                </Text>
              </View>
              
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: colors.surfaceDark, borderColor: colors.border },
                ]}
              >
                <KeyRound size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text, letterSpacing: 4 }]}
                  placeholder="******"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  keyboardType="number-pad"
                  maxLength={6}
                  value={pin}
                  onChangeText={handlePinChange}
                />
              </View>

              {/* PIN Indicator Dots */}
              <View style={styles.pinDotsContainer}>
                {Array.from({ length: 6 }).map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.pinDot,
                      {
                        backgroundColor:
                          idx < pin.length ? colors.accent : colors.border,
                        transform: [{ scale: idx < pin.length ? 1.15 : 1 }],
                      },
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Error Message Alert Box */}
            {Boolean(errorMessage) && (
              <View
                style={[
                  styles.errorContainer,
                  { backgroundColor: colors.errorBg, borderColor: colors.errorBorder },
                ]}
              >
                <ShieldAlert size={18} color={colors.error} style={{ marginRight: 8 }} />
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errorMessage}
                </Text>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: colors.accent },
                (loading || pin.length !== 6 || phone.length < 10) && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={[styles.buttonText, { color: colors.white }]}>Masuk ke Dashboard</Text>
                  <ArrowRight size={18} color={colors.white} style={{ marginLeft: 8 }} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoIconBg: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  formCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    gap: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  fieldGroup: {
    gap: 6,
  },
  pinHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pinCountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 50,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontWeight: '500',
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  pinDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  button: {
    height: 52,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    shadowColor: '#c55a2b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.55,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
