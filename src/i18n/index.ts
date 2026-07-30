import * as Localization from 'expo-localization';
import id from './id.json';
import en from './en.json';

export type TranslationKey = keyof typeof id;

const locales: Record<string, Record<string, string>> = { id, en };

let currentLocale: string = 'id';

export function setLocale(locale: string) {
  if (locales[locale]) {
    currentLocale = locale;
  }
}

export function getLocale(): string {
  return currentLocale;
}

export function detectLocale(): string {
  const locales = Localization.getLocales();
  const lang = locales[0]?.languageCode || 'id';
  return lang === 'en' ? 'en' : 'id';
}

export function t(key: string, params?: Record<string, string | number>): string {
  const translation = (locales[currentLocale] as Record<string, string>)?.[key];
  if (!translation) return key;

  if (params) {
    return Object.entries(params).reduce(
      (str, [k, v]) => str.replace(`{${k}}`, String(v)),
      translation
    );
  }

  return translation;
}

export function useT() {
  return { t, setLocale, getLocale, currentLocale };
}
