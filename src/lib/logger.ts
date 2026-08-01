import { Sentry } from './sentry';
import { saveLog } from './sqlite-db';

const TAG = '[RK_COURIER]';

let origLog: (...args: any[]) => void = () => {};
let origWarn: (...args: any[]) => void = () => {};
let origError: (...args: any[]) => void = () => {};

function toMessage(args: unknown[]): string {
  return args
    .map((a) => {
      if (typeof a === 'string') return a;
      if (a instanceof Error) return `${a.name}: ${a.message}\n${a.stack || ''}`;
      try {
        return JSON.stringify(a);
      } catch {
        return String(a);
      }
    })
    .join(' ');
}

function emit(level: 'debug' | 'info' | 'warn' | 'error', args: unknown[]) {
  const msg = toMessage(args);
  const line = `${TAG} [${level.toUpperCase()}] ${msg}`;
  const sentryLevel = level === 'warn' ? 'warning' : level === 'debug' ? 'debug' : level;

  if (level === 'error') origError.call(console, line);
  else if (level === 'warn') origWarn.call(console, line);
  else origLog.call(console, line);

  if (level === 'error' || level === 'warn') {
    Sentry.addBreadcrumb({ level: sentryLevel, message: line, category: 'app' });
    saveLog(level, line);
  }
}

function captureUncaughtError(err: unknown, isFatal: boolean) {
  const msg = toMessage([err]);
  const line = `${TAG} [UNCAUGHT${isFatal ? '_FATAL' : ''}] ${msg}`;
  console.error(line);
  Sentry.captureException(err);
  saveLog('error', line);
}

let installed = false;

export function installErrorLogging() {
  if (installed) return;
  installed = true;

  const c = console as any;
  origLog = c.log;
  origWarn = c.warn;
  origError = c.error;

  c.log = (...args: unknown[]) => emit('info', args);
  c.warn = (...args: unknown[]) => emit('warn', args);
  c.error = (...args: unknown[]) => emit('error', args);

  const ErrorUtils = (globalThis as any).ErrorUtils as
    | { setGlobalHandler: (h: (err: unknown, isFatal: boolean) => void) => void }
    | undefined;

  if (ErrorUtils?.setGlobalHandler) {
    ErrorUtils.setGlobalHandler(captureUncaughtError);
  }
}

export function logInfo(...args: unknown[]) {
  emit('info', args);
}

export function logWarn(...args: unknown[]) {
  emit('warn', args);
}

export function logError(...args: unknown[]) {
  emit('error', args);
}
