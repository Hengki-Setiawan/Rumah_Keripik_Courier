import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useAppColors, spacing, borderRadius } from '../../theme';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react-native';

interface BigActionButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'success' | 'danger' | 'ghost' | 'outline';
  flex?: boolean;
  icon?: ComponentType<LucideProps>;
}

export function BigActionButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  flex,
  icon: Icon,
}: BigActionButtonProps) {
  const colors = useAppColors();

  const bgMap: Record<string, string> = {
    primary: colors.accent,
    success: colors.green,
    danger: colors.error,
    ghost: 'transparent',
    outline: 'transparent',
  };

  const textMap: Record<string, string> = {
    primary: '#ffffff',
    success: '#ffffff',
    danger: '#ffffff',
    ghost: colors.accent,
    outline: colors.text,
  };

  const isBordered = variant === 'ghost' || variant === 'outline';
  const borderColor = variant === 'outline' ? colors.border : colors.accent;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        flex && styles.flex,
        {
          backgroundColor: bgMap[variant],
          opacity: disabled || loading ? 0.5 : 1,
          borderWidth: isBordered ? 1 : 0,
          borderColor: isBordered ? borderColor : 'transparent',
        },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textMap[variant]} />
      ) : (
        <View style={styles.inner}>
          {Icon && <Icon size={18} color={textMap[variant]} style={{ marginRight: 8 }} />}
          <Text style={[styles.label, { color: textMap[variant] }]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    minHeight: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  flex: {
    flex: 1,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 17,
    fontWeight: '700',
  },
});
