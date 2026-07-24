import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { colors, spacing, borderRadius } from '../../src/theme';
import { getToken } from '../../src/lib/storage';

interface EarningItem {
  id: string;
  orderId: string;
  baseFee: number;
  bonusAmount: number;
  status: string;
  createdAt: string;
}

interface EarningsResponse {
  ok: boolean;
  earnings: EarningItem[];
  summary: { totalConfirmed: number; pendingTotal: number; deliveryCount: number; period: string };
}

export default function EarningsScreen() {
  const [data, setData] = useState<EarningsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => { loadEarnings(); }, [period]);

  async function loadEarnings() {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`https://rumah-keripik.vercel.app/api/courier/earnings?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.ok) setData(json);
    } finally {
      setLoading(false);
    }
  }

  function formatRp(n: number) { return `Rp ${n.toLocaleString('id-ID')}`; }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Pendapatan Saya', headerShown: true, headerStyle: { backgroundColor: '#faf6ef' }, headerTintColor: '#333' }} />
      <View style={styles.periodRow}>
        {(['daily', 'weekly', 'monthly'] as const).map((p) => (
          <TouchableOpacity key={p} style={[styles.periodBtn, period === p && styles.periodBtnActive]} onPress={() => setPeriod(p)}>
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p === 'daily' ? 'Harian' : p === 'weekly' ? 'Mingguan' : 'Bulanan'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#c55a2b" style={{ marginTop: 40 }} />
      ) : data ? (
        <>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Pendapatan</Text>
            <Text style={styles.summaryAmount}>{formatRp(data.summary.totalConfirmed)}</Text>
            <Text style={styles.summaryMeta}>{data.summary.deliveryCount} pengiriman</Text>
            {data.summary.pendingTotal > 0 && (
              <Text style={styles.pendingNote}>Pending: {formatRp(data.summary.pendingTotal)}</Text>
            )}
          </View>

          <FlatList
            data={data.earnings}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemOrder}>{item.orderId}</Text>
                  <Text style={styles.itemDate}>{new Date(item.createdAt).toLocaleDateString('id-ID')}</Text>
                </View>
                <View style={styles.itemRight}>
                  <Text style={styles.itemAmount}>{formatRp(item.baseFee + item.bonusAmount)}</Text>
                  {item.bonusAmount > 0 && <Text style={styles.bonus}>+{formatRp(item.bonusAmount)} bonus</Text>}
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.empty}>Belum ada pendapatan</Text>}
          />
        </>
      ) : (
        <Text style={styles.empty}>Gagal memuat data</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf6ef' },
  periodRow: { flexDirection: 'row', padding: spacing.md, gap: 8 },
  periodBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1, borderColor: '#e5dcc9' },
  periodBtnActive: { backgroundColor: '#c55a2b', borderColor: '#c55a2b' },
  periodText: { fontSize: 13, fontWeight: '500', color: '#666' },
  periodTextActive: { color: '#fff' },
  summaryCard: { backgroundColor: '#fff', margin: spacing.md, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center' },
  summaryLabel: { fontSize: 14, color: '#666' },
  summaryAmount: { fontSize: 28, fontWeight: '700', color: '#2e7d32', marginVertical: 4 },
  summaryMeta: { fontSize: 13, color: '#999' },
  pendingNote: { fontSize: 12, color: '#c55a2b', marginTop: 4 },
  list: { padding: spacing.md },
  item: {
    backgroundColor: '#fff', borderRadius: borderRadius.md, padding: spacing.md, marginBottom: 8,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  itemLeft: {},
  itemOrder: { fontSize: 13, fontWeight: '600', color: '#333' },
  itemDate: { fontSize: 11, color: '#999', marginTop: 2 },
  itemRight: { alignItems: 'flex-end' },
  itemAmount: { fontSize: 15, fontWeight: '700', color: '#333' },
  bonus: { fontSize: 11, color: '#2e7d32' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
});
