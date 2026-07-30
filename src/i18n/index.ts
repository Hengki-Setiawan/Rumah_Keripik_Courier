import { getLocales } from 'expo-localization';
import id from './id.json';
import en from './en.json';

type TranslationKey = keyof typeof id;

const translations: Record<string, Record<TranslationKey, string>> = { id, en };

const defaultLocale = 'id';

function getDeviceLocale(): string {
  try {
    const locales = getLocales();
    const lang = locales?.[0]?.languageCode ?? defaultLocale;
    return translations[lang] ? lang : defaultLocale;
  } catch {
    return defaultLocale;
  }
}

let currentLocale: string = getDeviceLocale();

export function setLocale(locale: string) {
  if (translations[locale]) {
    currentLocale = locale;
  }
}

export function getLocale(): string {
  return currentLocale;
}

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const text = translations[currentLocale]?.[key] ?? translations[defaultLocale][key] ?? key;
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (_, k) => {
    const v = params[k];
    return v != null ? String(v) : `{${k}}`;
  });
}
