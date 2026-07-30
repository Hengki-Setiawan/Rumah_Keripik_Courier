import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { colors, spacing } from '../theme';
import { getQueueStatus } from '../lib/offline-queue';

type SyncState = 'synced' | 'syncing' | 'pending' | 'offline';

export default function SyncIndicator() {
  const [state, setState] = useState<SyncState>('synced');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((netState) => {
      if (!netState.isConnected) {
        setState('offline');
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const isOnline = (await NetInfo.fetch()).isConnected;
      if (!isOnline) {
        setState('offline');
        return;
      }
      try {
        const status = await getQueueStatus();
        setPendingCount(status.count);
        if (status.count > 0) {
          setState('pending');
        } else {
          setState('synced');
        }
      } catch {
        setState('synced');
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (state === 'synced' && pendingCount === 0) return null;

  const icon = state === 'offline' ? '📡' : state === 'pending' ? '🔄' : '✅';
  const label = state === 'offline' ? 'Offline'
    : state === 'pending' ? `${pendingCount} menunggu`
    : 'Tersinkron';

  return (
    <View style={[styles.badge, state === 'offline' ? styles.offline : state === 'pending' ? styles.pending : styles.synced]}>
      {state === 'pending' && <ActivityIndicator size={10} color="#d97706" style={{ marginRight: 3 }} />}
      <Text style={styles.text}>{icon} {label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
  },
  synced: {},
  pending: {
    backgroundColor: '#fef3c7',
  },
  offline: {
    backgroundColor: '#fef2f2',
  },
  text: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
