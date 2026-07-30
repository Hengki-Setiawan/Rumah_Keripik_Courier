import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Phone,
  MessageCircle,
  Navigation,
  Package,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  FileText,
  User,
  ShoppingBag,
} from 'lucide-react-native';

import { useAppColors, spacing, borderRadius } from '../../src/theme';
import { getTodayDeliveries, startDelivery } from '../../src/lib/api-client';
import type { CourierDeliveryDto } from '../../src/lib/types';

export default function DeliveryDetailScreen() {
  const colors = useAppColors();
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
      Alert.alert('Gagal', 'Gagal memuat data detail pengiriman');
    }
    setLoading(false);
  }

  async function handleStart() {
    if (!delivery) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    }
    setActionLoading(true);
    try {
      await startDelivery(delivery.id);
      setDelivery({ ...delivery, status: 'Dalam_Pengiriman' });
      Alert.alert('Berhasil', 'Status pengiriman diubah ke Dalam Perjalanan');
    } catch {
      Alert.alert('Gagal', 'Gagal memperbarui status pengiriman');
    }
    setActionLoading(false);
  }

  function callCustomer() {
    if (!delivery?.customer_phone) return;
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => undefined);
    }
    const phone = delivery.customer_phone.startsWith('0')
      ? '62' + delivery.customer_phone.slice(1)
      : delivery.customer_phone;
    Linking.openURL(`tel:${phone}`);
  }

  function whatsappCustomer() {
    if (!delivery?.customer_phone) return;
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => undefined);
    }
    const phone = delivery.customer_phone.startsWith('0')
      ? '62' + delivery.customer_phone.slice(1)
      : delivery.customer_phone;
    const text = encodeURIComponent(`Halo Kak ${delivery.customer_name}, saya kurir Rumah Keripik ingin mengantarkan pesanan ${delivery.kode_pesanan}.`);
    Linking.openURL(`https://wa.me/${phone}?text=${text}`);
  }

  function openMap() {
    if (!delivery) return;
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => undefined);
    }
    router.push(`/delivery/${delivery.id}/map`);
  }

  function goToProof() {
    if (!delivery) return;
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => undefined);
    }
    router.push(`/delivery/${delivery.id}/proof`);
  }

  function goToFail() {
    if (!delivery) return;
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => undefined);
    }
    router.push(`/delivery/${delivery.id}/fail`);
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'Siap_Dikirim':
        return { label: 'Siap Diambil', color: colors.accent, bg: colors.accentLight };
      case 'Dalam_Pengiriman':
        return { label: 'Dalam Perjalanan', color: colors.info, bg: 'rgba(61,126,166,0.14)' };
      case 'Terkirim':
        return { label: 'Terkirim', color: colors.green, bg: colors.greenLight };
      case 'Gagal':
        return { label: 'Gagal', color: colors.error, bg: colors.errorBg };
      default:
        return { label: status, color: colors.textMuted, bg: colors.surfaceDark };
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (!delivery) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.notFoundContainer}>
          <XCircle size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.textMuted }]}>
            Detail pengiriman tidak ditemukan
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <ArrowLeft size={16} color={colors.text} style={{ marginRight: 6 }} />
            <Text style={[styles.backButtonText, { color: colors.text }]}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const badge = getStatusBadge(delivery.status);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: `Resi ${delivery.kode_pesanan}`,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Status Header Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statusRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <FileText size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.orderCode, { color: colors.textSecondary }]}>
                {delivery.kode_pesanan}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
            </View>
          </View>
        </View>

        {/* Customer Info Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <User size={18} color={colors.accent} style={{ marginRight: 6 }} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Informasi Pelanggan</Text>
          </View>

          <Text style={[styles.label, { color: colors.textMuted }]}>Nama Pembeli</Text>
          <Text style={[styles.value, { color: colors.text }]}>{delivery.customer_name}</Text>

          <Text style={[styles.label, { color: colors.textMuted }]}>Nomor HP (WhatsApp)</Text>
          <Text style={[styles.value, { color: colors.text }]}>{delivery.customer_phone}</Text>

          <Text style={[styles.label, { color: colors.textMuted }]}>Alamat Tujuan</Text>
          <Text style={[styles.value, { color: colors.text }]}>{delivery.address}</Text>

          {delivery.distance_km && (
            <>
              <Text style={[styles.label, { color: colors.textMuted }]}>Jarak dari Gudang</Text>
              <Text style={[styles.value, { color: colors.accent }]}>
                {delivery.distance_km} km
              </Text>
            </>
          )}
        </View>

        {/* Items List Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <ShoppingBag size={18} color={colors.accent} style={{ marginRight: 6 }} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Rincian Barang Order</Text>
          </View>

          {delivery.items.map((item, i) => (
            <View
              key={i}
              style={[styles.itemRow, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.itemQty, { color: colors.textSecondary }]}>
                {item.quantity} × Rp {item.price.toLocaleString('id-ID')}
              </Text>
            </View>
          ))}
        </View>

        {/* Notes Card */}
        {Boolean(delivery.notes) && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Catatan Pembeli</Text>
            <Text style={[styles.value, { color: colors.textSecondary }]}>{delivery.notes}</Text>
          </View>
        )}

        {/* Action Buttons: Phone, WhatsApp, Map */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={callCustomer}
            activeOpacity={0.7}
          >
            <Phone size={16} color={colors.info} />
            <Text style={[styles.actionBtnText, { color: colors.text }]}>Telepon</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={whatsappCustomer}
            activeOpacity={0.7}
          >
            <MessageCircle size={16} color={colors.green} />
            <Text style={[styles.actionBtnText, { color: colors.text }]}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={openMap}
            activeOpacity={0.7}
          >
            <Navigation size={16} color={colors.accent} />
            <Text style={[styles.actionBtnText, { color: colors.text }]}>Navigasi Peta</Text>
          </TouchableOpacity>
        </View>

        {/* Primary Delivery Status Actions */}
        {delivery.status === 'Siap_Dikirim' && (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.accent }]}
            onPress={handleStart}
            disabled={actionLoading}
            activeOpacity={0.8}
          >
            {actionLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <View style={styles.btnInner}>
                <Package size={18} color={colors.white} style={{ marginRight: 8 }} />
                <Text style={[styles.primaryButtonText, { color: colors.white }]}>
                  Ambil Barang & Mulai Kirim
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {delivery.status === 'Dalam_Pengiriman' && (
          <View style={styles.inTransitRow}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.green, flex: 1, marginBottom: 0 }]}
              onPress={goToProof}
              activeOpacity={0.8}
            >
              <View style={styles.btnInner}>
                <CheckCircle2 size={18} color={colors.white} style={{ marginRight: 8 }} />
                <Text style={[styles.primaryButtonText, { color: colors.white }]}>
                  Bukti Pengiriman
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.dangerButton,
                { backgroundColor: colors.errorBg, borderColor: colors.errorBorder },
              ]}
              onPress={goToFail}
              activeOpacity={0.8}
            >
              <XCircle size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.backLink}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={16} color={colors.accent} style={{ marginRight: 6 }} />
          <Text style={[styles.backLinkText, { color: colors.accent }]}>
            Kembali ke Daftar Pengiriman
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl + 20,
    gap: spacing.md,
  },
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderCode: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  itemQty: {
    fontSize: 14,
    fontWeight: '500',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: 48,
    gap: 4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  primaryButton: {
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
  dangerButton: {
    borderRadius: borderRadius.md,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  inTransitRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '700',
  },
  notFoundContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: spacing.xl,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
