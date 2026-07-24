export function initSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  try {
    const Sentry = require('@sentry/react-native');
    Sentry.init({
      dsn,
      enableNativeCrashHandling: true,
      tracesSampleRate: 0.2,
      environment: process.env.EXPO_PUBLIC_APP_ENV || 'production',
    });
  } catch {
    // Sentry optional fallback
  }
}

export const Sentry = {
  captureException: (err: any) => console.error('[Sentry Fallback]', err),
  captureMessage: (msg: string) => console.log('[Sentry Fallback]', msg),
};
