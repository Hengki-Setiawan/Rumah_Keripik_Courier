import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react-native';
import { useAppColors } from '../../theme';
import { useSyncStore } from '../../store/sync-store';
import { getPendingCount, getUnsyncedLocationCount } from '../../db/sync-queue';

export function SyncIndicator() {
  const colors = useAppColors();
  const isOnline = useSyncStore((s) => s.isOnline);
  const pendingCount = useSyncStore((s) => s.pendingCount);
  const [totalPending, setTotalPending] = useState(0);

  useEffect(() => {
    const interval = setInterval(async () => {
      const mutations = await getPendingCount();
      const locations = await getUnsyncedLocationCount();
      setTotalPending(mutations + locations);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!isOnline) {
    return (
      <View style={styles.wrap}>
        <CloudOff size={16} color={colors.error} />
      </View>
    );
  }

  if (totalPending > 0) {
    return (
      <View style={styles.wrap}>
        <RefreshCw size={14} color={colors.warning} />
        <Text style={[styles.count, { color: colors.warning }]}>{totalPending}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Cloud size={14} color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  count: {
    fontSize: 10,
    fontWeight: '700',
  },
});
