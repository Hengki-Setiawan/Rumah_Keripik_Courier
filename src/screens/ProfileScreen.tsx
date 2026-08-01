import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  User,
  Phone,
  Truck,
  FileCheck,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Sun,
  Moon,
  Settings,
} from 'lucide-react-native';

import { useAppColors, spacing, borderRadius } from '../theme';
import { getProfile } from '../lib/api-client';
import { getToken, removeToken } from '../lib/storage';
import { toggleTheme } from '../lib/theme-context';
import type { CourierDto } from '../lib/types';

export default function ProfileScreen() {
  const colors = useAppColors();
  const [profile, setProfile] = useState<CourierDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = await getProfile();
      setProfile(data.courier);
    } catch (e) {
      console.error('loadProfile failed:', e);
      Alert.alert('Gagal', 'Gagal memuat profil kurir');
    }
    setLoading(false);
  }

  async function handleLogout() {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
    Alert.alert('Konfirmasi Logout', 'Apakah Anda yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: performLogout },
    ]);
  }

  async function performLogout() {
    setLoggingOut(true);
    try {
      const token = await getToken();
      if (token) {
        await fetch('https://rumah-keripik.vercel.app/api/courier/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (e) {
      console.error('logout API call failed:', e);
    }
    await removeToken();
    setLoggingOut(false);
    router.replace('/login');
  }

  async function handleToggleTheme() {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => undefined);
    }
    await toggleTheme();
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen
        options={{
          title: 'Profil Akun Kurir',
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar Section */}
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <Text style={styles.avatarText}>
              {profile?.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={[styles.profileName, { color: colors.text }]}>{profile?.name || 'Kurir'}</Text>
          <View style={[styles.activeStatusBadge, { backgroundColor: profile?.is_active ? colors.greenLight : colors.errorBg }]}>
            <ShieldCheck size={14} color={profile?.is_active ? colors.green : colors.error} style={{ marginRight: 4 }} />
            <Text style={[styles.activeStatusText, { color: profile?.is_active ? colors.green : colors.error }]}>
              {profile?.is_active ? 'Akun Terverifikasi Aktif' : 'Akun Nonaktif'}
            </Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <InfoRow icon={<User size={18} color={colors.accent} />} label="Nama Lengkap" value={profile?.name} />
          <InfoRow icon={<Phone size={18} color={colors.info} />} label="Nomor HP WhatsApp" value={profile?.phone} />
          <InfoRow icon={<Truck size={18} color={colors.accent} />} label="Jenis Kendaraan" value={profile?.vehicle === 'mobil' ? 'Mobil Operasional' : 'Motor Operasional'} />
          <InfoRow icon={<FileCheck size={18} color={colors.green} />} label="Plat Nomor Kendaraan" value={profile?.plat_no || '-'} />
        </View>

        {/* Settings */}
        <TouchableOpacity
          style={[styles.toggleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push('/settings' as any)}
          activeOpacity={0.7}
        >
          <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
            <Settings size={18} color={colors.accent} style={{ marginRight: 8 }} />
            <Text style={[styles.toggleLabel, { color: colors.text }]}>Pengaturan Aplikasi</Text>
            <ChevronRight size={16} color={colors.textMuted} />
          </View>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={handleToggleTheme}
            activeOpacity={0.7}
          >
            <Sun size={18} color={colors.accent} style={{ marginRight: 8 }} />
            <Text style={[styles.toggleLabel, { color: colors.text }]}>Tema Terang (Light Mode)</Text>
            <View style={[styles.radio, { borderColor: colors.accent }, { backgroundColor: colors.accent }]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={handleToggleTheme}
            activeOpacity={0.7}
          >
            <Moon size={18} color={colors.accent} style={{ marginRight: 8 }} />
            <Text style={[styles.toggleLabel, { color: colors.text }]}>Tema Gelap (Dark Mode)</Text>
            <View style={[styles.radio, { borderColor: colors.textMuted }]} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.error }]}
          onPress={handleLogout}
          activeOpacity={0.8}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <LogOut size={18} color={colors.white} style={{ marginRight: 8 }} />
              <Text style={styles.logoutText}>Keluar / Logout Akun</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  const colors = useAppColors();
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <View style={styles.infoLeft}>
        {icon}
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value || '-'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  activeStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  activeStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  toggleCard: {
    borderRadius: borderRadius.lg,
    width: '100%',
    borderWidth: 1,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 5,
  },
  logoutButton: {
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    flexDirection: 'row',
    minHeight: 52,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
