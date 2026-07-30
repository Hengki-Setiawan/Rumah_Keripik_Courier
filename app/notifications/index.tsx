import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Bell } from 'lucide-react-native';
import { FlashList } from '@shopify/flash-list';

import { useAppColors, spacing, borderRadius } from '../../src/theme';
import { GlassCard } from '../../src/components/ui/GlassCard';
import Container from '../../src/components/Container';
import { getNotifications, markNotificationRead } from '../../src/lib/api-client';
import { t } from '../../src/i18n';

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
  const colors = useAppColors();
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
      Alert.alert(t('common.failed'), t('notification.loadFailed'));
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
    if (diffMin < 1) return t('notification.justNow');
    if (diffMin < 60) return t('notification.minAgo', { count: diffMin });
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return t('notification.hourAgo', { count: diffHour });
    return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <Container>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: colors.accent }]}>{'< '}{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('notification.title')}</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={() => handleMarkRead()}>
            <Text style={[styles.markAll, { color: colors.accent }]}>{t('notification.markAllRead')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlashList
        data={notifs}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadNotifications(); }} tintColor={colors.accent} colors={[colors.accent]} />}
        ListEmptyComponent={
          loading ? (
            <Text style={[styles.empty, { color: colors.textMuted }]}>{t('common.loading')}</Text>
          ) : (
            <View style={styles.emptyContainer}>
              <Bell size={40} color={colors.textMuted} />
              <Text style={[styles.empty, { color: colors.textMuted }]}>{t('notification.empty')}</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              if (!item.isRead) handleMarkRead(item.id);
              if (item.linkUrl) router.push(item.linkUrl as any);
            }}
            activeOpacity={0.8}
          >
            <GlassCard noPadding>
              <View style={[
                styles.notifCard,
                { backgroundColor: item.isRead ? 'transparent' : colors.accentLight },
              ]}>
                <View style={styles.notifHeader}>
                  <Text style={[styles.notifTitle, { color: colors.text }, !item.isRead && styles.unreadTitle]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.notifTime, { color: colors.textMuted }]}>{formatTime(item.createdAt)}</Text>
                </View>
                <Text style={[styles.notifBody, { color: colors.textSecondary }]}>{item.body}</Text>
                {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />}
              </View>
            </GlassCard>
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
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  markAll: {
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    paddingBottom: spacing.xxl,
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
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  notifTime: {
    fontSize: 11,
    marginLeft: spacing.sm,
  },
  notifBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  unreadDot: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  empty: {
    textAlign: 'center',
    fontSize: 16,
  },
  notifCard: {
    padding: spacing.lg,
    marginBottom: spacing.sm,
    position: 'relative',
    borderRadius: borderRadius.lg,
  },
});
