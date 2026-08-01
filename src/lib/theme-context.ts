import { useEffect } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'courier_theme_pref';
const FALLBACK_SOS = ['08123456789', '08234567890'];

export const SOS_FALLBACK_CONTACTS = FALLBACK_SOS;

export function useThemeMode() {
  const system = useColorScheme();
  const effective = system || 'light';

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((v) => {
      if (v === 'dark' || v === 'light') {
        Appearance.setColorScheme(v);
      }
    });
  }, []);

  return effective;
}

export async function toggleTheme() {
  const current = Appearance.getColorScheme();
  const next = current === 'dark' ? 'light' : 'dark';
  await AsyncStorage.setItem(THEME_KEY, next);
  Appearance.setColorScheme(next);
}

export async function setThemeMode(t: 'light' | 'dark') {
  await AsyncStorage.setItem(THEME_KEY, t);
  Appearance.setColorScheme(t);
}
