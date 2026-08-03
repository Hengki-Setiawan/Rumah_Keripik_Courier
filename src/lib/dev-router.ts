import * as Linking from 'expo-linking';
import { router } from 'expo-router';

const DEV_ONLY = __DEV__;

const ROUTE_ALIASES: Record<string, string> = {
  dashboard: '/',
  home: '/',
  history: '/history',
  riwayat: '/history',
  stats: '/stats',
  performa: '/stats',
  profile: '/profile',
  profil: '/profile',
  shift: '/shift',
  earnings: '/earnings',
  pendapatan: '/earnings',
  notifications: '/notifications',
  notif: '/notifications',
  incidents: '/incidents',
  sos: '/sos',
  settings: '/settings',
  lock: '/lock',
};

function resolveAlias(path: string): string {
  const cleaned = path.replace(/^\//, '').replace(/\/+/g, '/');
  if (ROUTE_ALIASES[cleaned]) return ROUTE_ALIASES[cleaned];
  if (cleaned.startsWith('delivery/')) return `/${cleaned}`;
  return `/${cleaned}`;
}

type Pending = { path: string } | null;
let pending: Pending = null;
let onDevLogin: (() => void) | null = null;

function extractDevPath(url: string | null): string | null {
  if (!url || !url.includes('://')) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.host;
    if (host !== 'dev' && !parsed.pathname.startsWith('/dev')) return null;
    let target = parsed.pathname.replace(/^\/dev/, '').replace(/^\/app/, '');
    if (!target) target = '/dashboard';
    return resolveAlias(target);
  } catch {
    return null;
  }
}

function handleUrl(url: string | null) {
  if (!DEV_ONLY) return;
  const path = extractDevPath(url);
  if (path) {
    pending = { path };
    if (onDevLogin) onDevLogin();
  }
}

let attached = false;

export function initDevRouter(cb: () => void) {
  if (!DEV_ONLY) return;
  onDevLogin = cb;
  if (attached) return;
  attached = true;

  Linking.getInitialURL().then((url) => {
    handleUrl(url);
    setTimeout(() => tryNavigateAfterDevLogin(), 300);
  });
  Linking.addEventListener('url', (event) => {
    handleUrl(event.url);
    setTimeout(() => tryNavigateAfterDevLogin(), 300);
  });
}

export function consumePendingDevRoute(): string | null {
  const p = pending;
  pending = null;
  return p?.path ?? null;
}

export function tryNavigateAfterDevLogin() {
  if (!DEV_ONLY) return;
  const path = consumePendingDevRoute();
  if (path) {
    setTimeout(() => router.push(path as any), 600);
  }
}