import { useColorScheme } from 'react-native';

export const lightColors = {
  bg: '#faf6ef',
  bgGradient: ['rgba(240,180,41,0.18)', 'transparent'],
  surface: '#fffaf4',
  surfaceDark: '#f8f0e5',
  border: '#f0dfca',
  borderHover: '#dfc5a8',
  text: '#2f241c',
  textSecondary: '#6f5d4f',
  textMuted: '#a08973',
  accent: '#c55a2b',
  accentHover: '#ae4d23',
  accentLight: '#fde8d9',
  green: '#5f7a2e',
  greenHover: '#4f6a24',
  greenLight: 'rgba(95,122,46,0.18)',
  error: '#dc2626',
  errorBg: '#fef2f2',
  errorBorder: '#fecaca',
  warning: '#d9a441',
  info: '#3d7ea6',
  white: '#ffffff',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.2)',
  cardShadow: 'rgba(47,36,28,0.06)',
  sosButton: '#c0392b',
  statusUnassigned: '#a8a29e',
  statusAssigned: '#3d7ea6',
  statusInTransit: '#c55a2b',
  statusArrived: '#d9a441',
  statusCompleted: '#7f9f3e',
  statusFailed: '#c0392b',
};

export const darkColors = {
  bg: '#1a1613',
  bgGradient: ['rgba(197,90,43,0.12)', 'transparent'],
  surface: '#25201b',
  surfaceDark: '#1e1a16',
  border: '#3a322b',
  borderHover: '#4d433b',
  text: '#f0e6db',
  textSecondary: '#b0a092',
  textMuted: '#7a6b5e',
  accent: '#d97706',
  accentHover: '#b25f00',
  accentLight: '#3d2e1f',
  green: '#7f9f3e',
  greenHover: '#8db34a',
  greenLight: 'rgba(127,159,62,0.25)',
  error: '#ef4444',
  errorBg: '#3b1f1f',
  errorBorder: '#7f2a2a',
  warning: '#d9a441',
  info: '#60a5d8',
  white: '#ffffff',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.5)',
  cardShadow: 'rgba(0,0,0,0.3)',
  sosButton: '#dc2626',
  statusUnassigned: '#6b635b',
  statusAssigned: '#60a5d8',
  statusInTransit: '#d97706',
  statusArrived: '#d9a441',
  statusCompleted: '#7f9f3e',
  statusFailed: '#ef4444',
};

export type ThemeColors = typeof lightColors;

export function useAppColors(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkColors : lightColors;
}

export const colors = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};
