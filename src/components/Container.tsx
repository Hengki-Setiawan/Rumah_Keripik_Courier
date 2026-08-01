import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';
import type { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  padded?: boolean;
}

export default function Container({ children, padded = true }: ContainerProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.inner, padded && styles.padded]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  inner: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.lg,
  },
});
