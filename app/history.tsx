import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../src/theme';
import { getTodayDeliveries } from '../src/lib/api-client';
import type { CourierDeliveryDto } from '../src/lib/types';

export default function HistoryScreen() {
  const [deliveries, setDeliveries] = useState<CourierDeliveryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const data = await getTodayDeliveries();
      setDeliveries(data.deliveries.filter((d) => d.status === 'Terkirim' || d.status === 'Gagal'));
    } catch {
      // silent
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.accent} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: 'Riwayat Pengiriman' }} />

      <FlatList
        data={deliveries}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Belum ada riwayat pengiriman</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/delivery/${item.id}`)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.orderCode}>{item.kode_pesanan}</Text>
              <View style={[styles.badge, { backgroundColor: item.status === 'Terkirim' ? colors.greenLight : colors.errorBg }]}>
                <Text style={[styles.badgeText, { color: item.status === 'Terkirim' ? colors.green : colors.error }]}>
                  {item.status === 'Terkirim' ? 'Terkirim' : 'Gagal'}
                </Text>
              </View>
            </View>
            <Text style={styles.customerName}>{item.customer_name}</Text>
            <Text style={styles.address} numberOfLines={1}>{item.address}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  list: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  orderCode: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  address: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 60,
    fontSize: 16,
  },
});
