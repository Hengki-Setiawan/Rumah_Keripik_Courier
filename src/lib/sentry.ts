type SentryBridge = {
  captureException: (err: unknown) => void;
  captureMessage: (msg: string, level?: 'info' | 'warning' | 'error' | 'fatal') => void;
  addBreadcrumb: (breadcrumb: { level?: 'debug' | 'info' | 'warning' | 'error' | 'fatal'; message: string; category?: string }) => void;
};

let SentryImpl: SentryBridge = {
  captureException: () => {},
  captureMessage: () => {},
  addBreadcrumb: () => {},
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
    SentryImpl = SentryModule;
  } catch {
    // Sentry optional — silently skipped
  }
}

export const Sentry: SentryBridge = {
  captureException: (err: unknown) => SentryImpl.captureException(err),
  captureMessage: (msg: string, level?: 'info' | 'warning' | 'error' | 'fatal') => SentryImpl.captureMessage(msg, level),
  addBreadcrumb: (breadcrumb) => SentryImpl.addBreadcrumb(breadcrumb),
};
