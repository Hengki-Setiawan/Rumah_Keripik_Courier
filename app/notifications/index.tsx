import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, borderRadius } from '../../src/theme';
import Container from '../../src/components/Container';
import Card from '../../src/components/Card';
import Button from '../../src/components/Button';
import { getNotifications, markNotificationRead } from '../../src/lib/api-client';

interface NotifItem {
  id: number;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data: string | null;
  linkUrl: string | null;
}

export default function NotificationsScreen() {
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    try {
      const res = await getNotifications(50);
      setNotifs(res.data.notifications as unknown as NotifItem[]);
      setUnreadCount(res.data.unreadCount);
    } catch {
      Alert.alert('Gagal memuat notifikasi');
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadNotifications(); }, []);

  const handleMarkRead = async (id?: number) => {
    await markNotificationRead(id);
    loadNotifications();
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Baru saja';
    if (diffMin < 60) return `${diffMin}m lalu`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}j lalu`;
    return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <Container>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>{'< Kembali'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifikasi</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={() => handleMarkRead()}>
            <Text style={styles.markAll}>Baca Semua</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifs}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadNotifications(); }} />}
        ListEmptyComponent={
          loading ? (
            <Text style={styles.empty}>Memuat...</Text>
          ) : (
            <Text style={styles.empty}>Tidak ada notifikasi</Text>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              if (!item.isRead) handleMarkRead(item.id);
              if (item.linkUrl) router.push(item.linkUrl as any);
            }}
          >
            <Card style={!item.isRead ? styles.unreadCard : undefined} accentColor={!item.isRead ? colors.accent : undefined}>
              <View style={styles.notifHeader}>
                <Text style={[styles.notifTitle, !item.isRead && styles.unreadTitle]}>{item.title}</Text>
                <Text style={styles.notifTime}>{formatTime(item.createdAt)}</Text>
              </View>
              <Text style={styles.notifBody}>{item.body}</Text>
              {!item.isRead && <View style={styles.unreadDot} />}
            </Card>
          </TouchableOpacity>
        )}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
  },
  back: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  markAll: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    paddingBottom: spacing.xxl,
  },
  unreadCard: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
    color: '#92400e',
  },
  notifTime: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  notifBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  unreadDot: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 60,
    fontSize: 16,
  },
});
