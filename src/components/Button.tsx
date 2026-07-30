import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, type ViewStyle } from 'react-native';
import { colors, borderRadius } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const variantStyles: Record<string, { bg: string; text: string; bgDisabled: string }> = {
  primary: { bg: colors.accent, text: '#ffffff', bgDisabled: '#d1a38b' },
  secondary: { bg: colors.green, text: '#ffffff', bgDisabled: '#9db86e' },
  danger: { bg: colors.error, text: '#ffffff', bgDisabled: '#f87171' },
  ghost: { bg: 'transparent', text: colors.accent, bgDisabled: '#f0f0f0' },
};

export default function Button({ title, onPress, variant = 'primary', loading, disabled, style }: ButtonProps) {
  const v = variantStyles[variant];
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: disabled ? v.bgDisabled : v.bg }, style]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <Text style={[styles.text, { color: v.text }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
  },
});
