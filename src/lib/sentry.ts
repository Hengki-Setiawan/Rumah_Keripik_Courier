let SentryFallback: { captureException: (err: unknown) => void; captureMessage: (msg: string) => void } = {
  captureException: () => {},
  captureMessage: () => {},
};

export function initSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  try {
    const SentryModule = require('@sentry/react-native');
    SentryModule.init({
      dsn,
      enableNativeCrashHandling: true,
      tracesSampleRate: 0.2,
      environment: process.env.EXPO_PUBLIC_APP_ENV || 'production',
    });
    SentryFallback = SentryModule;
  } catch {
    // Sentry optional — silently skipped
  }
}

export const Sentry = SentryFallback;
