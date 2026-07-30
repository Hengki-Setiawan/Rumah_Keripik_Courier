import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';

interface BigActionButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: string;
}

export default function BigActionButton({ title, onPress, loading, disabled, variant = 'primary', icon }: BigActionButtonProps) {
  const bgColor = variant === 'primary' ? colors.accent : variant === 'danger' ? colors.error : colors.green;
  const disabledStyle = (disabled || loading) ? { opacity: 0.6 } : {};

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: bgColor }, disabledStyle]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={styles.text}>
          {icon ? `${icon} ` : ''}{title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  text: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
