import * as Sentry from '@sentry/react-native';
import { isRunningInExpoGo } from 'expo';

export function initSentry() {
  if (isRunningInExpoGo()) return;
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
    enableNativeCrashHandling: true,
    tracesSampleRate: 0.2,
    environment: process.env.EXPO_PUBLIC_APP_ENV || 'production',
  });
}

export { Sentry };
