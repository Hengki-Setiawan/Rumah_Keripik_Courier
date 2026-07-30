import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated as RNAnimated,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
} from 'react-native-reanimated';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import {
  Store,
  Phone,
  ArrowRight,
  ShieldAlert,
  CheckCircle,
  Fingerprint,
} from 'lucide-react-native';

import { useAppColors, borderRadius, spacing } from '../src/theme';
import { login } from '../src/lib/api-client';
import { saveToken, saveCourierData } from '../src/lib/storage';
import { BigActionButton } from '../src/components/ui/BigActionButton';
import { useShakeAnimation, StaggerFadeInUp } from '../src/hooks/useMicroInteraction';
import { impactMedium, notificationError, notificationSuccess, selectionTap } from '../src/lib/haptics';
import { useAuth } from '../src/lib/auth-guard';

const PIN_LENGTH = 6;

export default function LoginScreen() {
  const colors = useAppColors();
  const { signIn } = useAuth();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const pinRefs = useRef<(TextInput | null)[]>([]);

  const fadeAnim = useRef(new RNAnimated.Value(0)).current;

  const { animatedStyle: shakeStyle, shake } = useShakeAnimation();

  useEffect(() => {
    if (lockoutSeconds > 0) {
      const timer = setInterval(() => {
        setLockoutSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutSeconds]);

  useEffect(() => {
    RNAnimated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  function handlePhoneChange(val: string) {
    const cleaned = val.replace(/[^0-9]/g, '');
    setPhone(cleaned);
    setErrorMessage('');
  }

  function handlePinDigit(text: string, index: number) {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);
    setErrorMessage('');

    if (Platform.OS !== 'web') selectionTap();

    if (digit && index < PIN_LENGTH - 1) {
      pinRefs.current[index + 1]?.focus();
    }
  }

  function handlePinKey(key: string, index: number) {
    if (key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  }

  function getPinString() {
    return pin.join('');
  }

  async function handleLogin() {
    setErrorMessage('');

    if (lockoutSeconds > 0) return;

    if (!phone || phone.length < 10) {
      setErrorMessage('Nomor HP wajib diisi minimal 10 digit');
      shake();
      if (Platform.OS !== 'web') notificationError();
      return;
    }

    const pinStr = getPinString();
    if (pinStr.length !== PIN_LENGTH) {
      setErrorMessage('PIN wajib terdiri dari tepat 6 digit');
      shake();
      if (Platform.OS !== 'web') notificationError();
      return;
    }

    setLoading(true);
    if (Platform.OS !== 'web') impactMedium();

    try {
      const result = await login(phone, pinStr);
      const token = result.accessToken || result.token;
      if (!token) {
        throw new Error('NO_TOKEN');
      }

      await saveToken(token);
      await saveCourierData(result.courier);
      if (Platform.OS !== 'web') notificationSuccess();

      signIn();
      setLoginSuccess(true);
      await new Promise((r) => setTimeout(r, 800));
      router.replace('/(tabs)' as any);
    } catch (error) {
      const rawMsg = error instanceof Error ? error.message : 'Gagal terhubung ke server';
      let localizedMsg = rawMsg;

      if (rawMsg === 'UNAUTHORIZED' || rawMsg.includes('401') || rawMsg.includes('tidak valid')) {
        localizedMsg = 'Nomor HP atau PIN 6-digit tidak sesuai. Silakan periksa kembali.';
      } else if (rawMsg === 'NO_TOKEN') {
        localizedMsg = 'Sesi login telah berakhir. Silakan login kembali.';
      } else if (rawMsg === 'NETWORK_ERROR' || rawMsg.includes('fetch') || rawMsg.includes('Network')) {
        localizedMsg = 'Koneksi internet bermasalah. Periksa jaringan HP Anda.';
      } else if (rawMsg === 'TOO_MANY_ATTEMPTS') {
        setLockoutSeconds(60);
        localizedMsg = 'Terlalu banyak percobaan. Silakan tunggu 60 detik.';
      }

      setErrorMessage(localizedMsg);
      shake();
      setPin(['', '', '', '', '', '']);
      pinRefs.current[0]?.focus();
      if (Platform.OS !== 'web') notificationError();
    } finally {
      setLoading(false);
    }
  }

  const isFormValid = phone.length >= 10 && getPinString().length === PIN_LENGTH && !lockoutSeconds;

  if (loginSuccess) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.successContainer}>
          <Animated.View entering={ZoomIn.duration(400).springify().damping(12)}>
            <View style={[styles.successCircle, { backgroundColor: colors.greenLight }]}>
              <CheckCircle size={64} color={colors.green} />
            </View>
          </Animated.View>
          <Animated.Text
            entering={FadeIn.duration(300).delay(200)}
            style={[styles.successTitle, { color: colors.text }]}
          >
            Berhasil Masuk
          </Animated.Text>
          <Animated.Text
            entering={FadeIn.duration(300).delay(400)}
            style={[styles.successSub, { color: colors.textSecondary }]}
          >
            Mengalihkan ke dashboard...
          </Animated.Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <RNAnimated.View style={{ opacity: fadeAnim }}>
            <Animated.View style={[styles.content, shakeStyle]}>
              {/* Glass Header with BlurView */}
              <BlurView
                intensity={40}
                tint={colors.bg === '#1a1613' ? 'dark' : 'light'}
                style={[
                  styles.glassHeader,
                  { backgroundColor: colors.bgGradient[0] },
                ]}
              >
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
                  Aplikasi Kurir Internal
                </Text>
              </BlurView>

              {/* Glass Form Card */}
              <BlurView
                intensity={60}
                tint={colors.bg === '#1a1613' ? 'dark' : 'light'}
                style={[
                  styles.glassCard,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surface + '80',
                  },
                ]}
              >
                {/* Phone Field */}
                <View style={styles.fieldGroup}>
                  <Text
                    style={[styles.label, { color: colors.textSecondary }]}
                    accessibilityRole="text"
                  >
                    Nomor HP (WhatsApp)
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      { backgroundColor: colors.surfaceDark, borderColor: colors.border },
                      phone.length >= 10 && { borderColor: colors.green },
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
                      editable={!loading}
                      accessibilityLabel="Nomor HP"
                      accessibilityRole="none"
                    />
                    {phone.length >= 10 && (
                      <CheckCircle size={16} color={colors.green} />
                    )}
                  </View>
                </View>

                {/* PIN Field — 6 Glass Boxes with Blur */}
                <View style={styles.fieldGroup}>
                  <View style={styles.pinHeaderRow}>
                    <Text
                      style={[styles.label, { color: colors.textSecondary }]}
                      accessibilityRole="text"
                    >
                      PIN Log-in (6 Digit)
                    </Text>
                    <View style={styles.pinHeaderRight}>
                      {lockoutSeconds > 0 && (
                        <Text style={[styles.lockoutText, { color: colors.error }]}>
                          {lockoutSeconds}s
                        </Text>
                      )}
                      <Text
                        style={[
                          styles.pinCountText,
                          { color: getPinString().length === PIN_LENGTH ? colors.green : colors.textMuted },
                        ]}
                      >
                        {getPinString().length}/{PIN_LENGTH}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.pinBoxesRow}>
                    {pin.map((digit, idx) => (
                      <BlurView
                        key={idx}
                        intensity={20}
                        tint={colors.bg === '#1a1613' ? 'dark' : 'light'}
                        style={[
                          styles.glassPinBox,
                          {
                            borderColor: digit
                              ? colors.accent
                              : errorMessage
                                ? colors.error
                                : colors.border,
                            backgroundColor: errorMessage
                              ? colors.errorBg + '60'
                              : digit
                                ? colors.accentLight + '40'
                                : 'transparent',
                          },
                        ]}
                      >
                        <TextInput
                          ref={(el) => { pinRefs.current[idx] = el; }}
                          style={[styles.pinBoxInput, { color: colors.text }]}
                          keyboardType="number-pad"
                          maxLength={1}
                          value={digit}
                          onChangeText={(t) => handlePinDigit(t, idx)}
                          onKeyPress={({ nativeEvent }) => handlePinKey(nativeEvent.key, idx)}
                          secureTextEntry
                          editable={!loading && !lockoutSeconds}
                          selectTextOnFocus
                          accessibilityLabel={`Digit PIN ke-${idx + 1}`}
                          accessibilityRole="none"
                        />
                        <Text
                          style={[
                            styles.pinDigitText,
                            {
                              color: digit
                                ? colors.accent
                                : errorMessage
                                  ? colors.error
                                  : colors.textMuted,
                              fontSize: digit ? 22 : 18,
                            },
                          ]}
                        >
                          {digit ? '●' : '○'}
                        </Text>
                      </BlurView>
                    ))}
                  </View>
                </View>

                {/* Error Message */}
                {Boolean(errorMessage) && (
                  <Animated.View
                    entering={StaggerFadeInUp(0, 0)}
                    style={[
                      styles.errorContainer,
                      { backgroundColor: colors.errorBg, borderColor: colors.errorBorder },
                    ]}
                    accessibilityRole="alert"
                    accessibilityLabel={errorMessage}
                  >
                    <ShieldAlert size={18} color={colors.error} style={{ marginRight: 8 }} />
                    <Text style={[styles.errorText, { color: colors.error }]}>
                      {errorMessage}
                    </Text>
                  </Animated.View>
                )}

                {/* Submit Button */}
                <BigActionButton
                  label={lockoutSeconds > 0 ? `Tunggu ${lockoutSeconds} detik...` : 'Masuk ke Dashboard'}
                  onPress={handleLogin}
                  loading={loading}
                  disabled={!isFormValid || loading}
                  variant={lockoutSeconds > 0 ? 'ghost' : 'primary'}
                  icon={lockoutSeconds > 0 ? undefined : ArrowRight}
                />

                {/* Biometric hint */}
                <View style={styles.biometricHint}>
                  <Fingerprint size={14} color={colors.textMuted} />
                  <Text style={[styles.biometricHintText, { color: colors.textMuted }]}>
                    Atau gunakan sidik jari/Face ID setelah login
                  </Text>
                </View>
              </BlurView>
            </Animated.View>
          </RNAnimated.View>
        </ScrollView>
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
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  glassHeader: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    paddingVertical: spacing.xl,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  logoIconBg: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  glassCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    gap: spacing.lg,
    overflow: 'hidden',
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
  pinHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lockoutText: {
    fontSize: 11,
    fontWeight: '800',
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
  pinBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  glassPinBox: {
    flex: 1,
    height: 60,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 0.85,
    overflow: 'hidden',
  },
  pinBoxInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
  },
  pinDigitText: {
    fontWeight: '800',
    textAlign: 'center',
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
  biometricHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  biometricHintText: {
    fontSize: 12,
    fontWeight: '500',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  successSub: {
    fontSize: 15,
    fontWeight: '500',
  },
});
