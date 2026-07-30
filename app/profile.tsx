import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../src/theme';
import { getProfile } from '../src/lib/api-client';
import { getToken, removeToken } from '../src/lib/storage';
import type { CourierDto } from '../src/lib/types';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<CourierDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = await getProfile();
      setProfile(data.courier);
    } catch {
      Alert.alert('Error', 'Gagal memuat profil');
    }
    setLoading(false);
  }

  async function handleLogout() {
    Alert.alert('Logout', 'Yakin ingin logout?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: performLogout },
    ]);
  }

  async function performLogout() {
    try {
      const token = await getToken();
      if (token) {
        await fetch('https://rumah-keripik.vercel.app/api/courier/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {}
    await removeToken();
    router.replace('/login');
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
      <Stack.Screen options={{ title: 'Profil', headerShown: true, headerStyle: { backgroundColor: colors.bg } }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <InfoRow label="Nama" value={profile?.name} />
          <InfoRow label="Nomor HP" value={profile?.phone} />
          <InfoRow label="Kendaraan" value={profile?.vehicle === 'mobil' ? 'Mobil' : 'Motor'} />
          <InfoRow label="Plat No" value={profile?.plat_no || '-'} />
          <InfoRow label="Status" value={profile?.is_active ? 'Aktif' : 'Nonaktif'} />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '-'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, alignItems: 'center' },
  avatarContainer: { marginBottom: spacing.lg, marginTop: spacing.md },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#fff' },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    gap: 0,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  infoLabel: { fontSize: 14, color: colors.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  logoutButton: {
    marginTop: spacing.xl,
    backgroundColor: '#dc2626',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    width: '100%',
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
