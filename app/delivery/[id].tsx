import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Linking, ActivityIndicator, Platform } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../../src/theme';
import { getTodayDeliveries, startDelivery } from '../../src/lib/api-client';
import type { CourierDeliveryDto } from '../../src/lib/types';

export default function DeliveryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [delivery, setDelivery] = useState<CourierDeliveryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadDelivery();
  }, [id]);

  async function loadDelivery() {
    try {
      const data = await getTodayDeliveries();
      const found = data.deliveries.find((d) => String(d.id) === id);
      setDelivery(found || null);
    } catch {
      Alert.alert('Error', 'Gagal memuat data');
    }
    setLoading(false);
  }

  async function handleStart() {
    if (!delivery) return;
    setActionLoading(true);
    try {
      await startDelivery(delivery.id);
      setDelivery({ ...delivery, status: 'Dalam_Pengiriman' });
      Alert.alert('Sukses', 'Status diubah ke Dalam Pengiriman');
    } catch {
      Alert.alert('Error', 'Gagal mengupdate status');
    }
    setActionLoading(false);
  }

  function callCustomer() {
    if (!delivery?.customer_phone) return;
    const phone = delivery.customer_phone.startsWith('0')
      ? '62' + delivery.customer_phone.slice(1)
      : delivery.customer_phone;
    Linking.openURL(`tel:${phone}`);
  }

  function whatsappCustomer() {
    if (!delivery?.customer_phone) return;
    const phone = delivery.customer_phone.startsWith('0')
      ? '62' + delivery.customer_phone.slice(1)
      : delivery.customer_phone;
    Linking.openURL(`https://wa.me/${phone}?text=Halo%20${encodeURIComponent(delivery.customer_name)}%2C%20saya%20kurir%20Rumah%20Keripik`);
  }

  function openMap() {
    if (!delivery) return;
    router.push(`/delivery/${delivery.id}/map`);
  }

  function goToProof() {
    if (!delivery) return;
    router.push(`/delivery/${delivery.id}/proof`);
  }

  function goToFail() {
    if (!delivery) return;
    router.push(`/delivery/${delivery.id}/fail`);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.accent} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (!delivery) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Pengiriman tidak ditemukan</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Kembali</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: `Pengiriman ${delivery.kode_pesanan}` }} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <Text style={styles.orderCode}>{delivery.kode_pesanan}</Text>
            <View style={[styles.badge, { backgroundColor: delivery.status === 'Terkirim' ? colors.greenLight : delivery.status === 'Gagal' ? colors.errorBg : colors.accentLight }]}>
              <Text style={[styles.badgeText, { color: delivery.status === 'Terkirim' ? colors.green : delivery.status === 'Gagal' ? colors.error : colors.accent }]}>
                {delivery.status === 'Siap_Dikirim' ? 'Siap Diambil' : delivery.status === 'Dalam_Pengiriman' ? 'Dalam Perjalanan' : delivery.status === 'Terkirim' ? 'Terkirim' : 'Gagal'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Informasi Pelanggan</Text>
          <Text style={styles.label}>Nama</Text>
          <Text style={styles.value}>{delivery.customer_name}</Text>
          <Text style={styles.label}>Telepon</Text>
          <Text style={styles.value}>{delivery.customer_phone}</Text>
          <Text style={styles.label}>Alamat</Text>
          <Text style={styles.value}>{delivery.address}</Text>
          {delivery.distance_km && (
            <>
              <Text style={styles.label}>Jarak dari Gudang</Text>
              <Text style={styles.value}>{delivery.distance_km} km</Text>
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Pesanan</Text>
          {delivery.items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQty}>{item.quantity} x Rp {item.price.toLocaleString('id-ID')}</Text>
            </View>
          ))}
        </View>

        {delivery.notes && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Catatan</Text>
            <Text style={styles.value}>{delivery.notes}</Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={callCustomer}>
            <Text style={styles.actionText}>📞 Telepon</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={whatsappCustomer}>
            <Text style={styles.actionText}>💬 WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={openMap}>
            <Text style={styles.actionText}>🗺️ Map</Text>
          </TouchableOpacity>
        </View>

        {delivery.status === 'Siap_Dikirim' && (
          <TouchableOpacity style={styles.primaryButton} onPress={handleStart} disabled={actionLoading}>
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Ambil Barang & Mulai Kirim</Text>
            )}
          </TouchableOpacity>
        )}

        {delivery.status === 'Dalam_Pengiriman' && (
          <>
            <TouchableOpacity style={styles.primaryButton} onPress={goToProof}>
              <Text style={styles.primaryButtonText}>📸 Bukti Pengiriman</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dangerButton} onPress={goToFail}>
              <Text style={styles.dangerButtonText}>✖ Gagal Antar</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>← Kembali ke Daftar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl + 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderCode: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  value: {
    fontSize: 14,
    color: colors.text,
    marginTop: 1,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemName: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  itemQty: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    padding: spacing.md + 2,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: colors.errorBg,
    borderRadius: borderRadius.md,
    padding: spacing.md + 2,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.errorBorder,
  },
  dangerButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  backLinkText: {
    color: colors.accent,
    fontSize: 14,
  },
  errorText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 16,
    marginTop: 60,
  },
  backButton: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  backButtonText: {
    color: colors.accent,
    fontSize: 16,
  },
});
