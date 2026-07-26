import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { removeToken } from './storage';

const QUEUE_KEY = 'offline_request_queue';

export type QueuePriority = 'high' | 'normal';
export type QueueType = 'STATUS_UPDATE' | 'LOCATION_PING' | 'PROOF_UPLOAD' | 'OFFER_RESPONSE' | 'DELIVERY_SYNC_AUDIT';

export interface QueuedRequest {
  id: string;
  type: QueueType;
  path: string;
  method: string;
  body: string;
  token: string | null;
  priority: QueuePriority;
  createdAt: string;
  attempts: number;
  lastError?: string;
  needsReview?: boolean;
}

async function getQueue(): Promise<QueuedRequest[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveQueue(queue: QueuedRequest[]) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function computeBackoff(attempts: number): number {
  const base = 1000;
  const maxDelay = 30000;
  const exponential = Math.min(base * Math.pow(2, attempts), maxDelay);
  const jitter = exponential * 0.1 * Math.random();
  return Math.floor(exponential + jitter);
}

export async function enqueueRequest(
  path: string,
  method: string,
  body: object,
  token: string | null,
  type: QueueType = 'STATUS_UPDATE',
  priority: QueuePriority = 'normal',
) {
  const queue = await getQueue();
  queue.push({
    id: generateId(),
    type,
    path,
    method,
    body: JSON.stringify(body),
    token,
    priority,
    createdAt: new Date().toISOString(),
    attempts: 0,
  });
  await saveQueue(queue);
}

export async function processQueue() {
  const state = await NetInfo.fetch();
  if (!state.isConnected) return;

  const queue = await getQueue();
  if (queue.length === 0) return;

  const sorted = [...queue].sort((a, b) => {
    const p = { high: 0, normal: 1 };
    const pa = p[a.priority] ?? 1;
    const pb = p[b.priority] ?? 1;
    if (pa !== pb) return pa - pb;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const processed: QueuedRequest[] = [];
  const failed: QueuedRequest[] = [];

  for (const req of sorted) {
    if (req.needsReview) {
      failed.push(req);
      continue;
    }

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (req.token) headers['Authorization'] = `Bearer ${req.token}`;

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://rumah-keripik.vercel.app';
      const res = await fetch(`${apiUrl}${req.path}`, {
        method: req.method,
        headers,
        body: req.body,
      });

      if (res.status === 401) {
        await removeToken();
        req.needsReview = true;
        failed.push(req);
        continue;
      }

      if (res.ok || res.status === 409) {
        if (req.type !== 'LOCATION_PING' || processed.filter((p) => p.type === 'LOCATION_PING').length === 0) {
          processed.push(req);
        }
        continue;
      }

      req.attempts++;
      req.lastError = `HTTP ${res.status}`;
      if (req.attempts >= 5) {
        req.needsReview = true;
      }
      failed.push(req);
    } catch (err) {
      req.attempts++;
      req.lastError = String(err);
      if (req.attempts >= 5) {
        req.needsReview = true;
      }
      const delayMs = computeBackoff(req.attempts);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      failed.push(req);
    }
  }

  const remaining = [...failed, ...queue.filter((q) => !sorted.includes(q))];
  await saveQueue(remaining);
}

const SYNC_AUDIT_KEY = 'delivery_sync_audit_log';

export type SyncAuditEntry = {
  deliveryId: number;
  action: 'complete' | 'fail' | 'start';
  syncedAt: string;
  serverVerified: boolean;
  serverError?: string;
};

export async function recordSyncAudit(entry: Omit<SyncAuditEntry, 'syncedAt'>) {
  const raw = await AsyncStorage.getItem(SYNC_AUDIT_KEY);
  const log: SyncAuditEntry[] = raw ? JSON.parse(raw) : [];
  log.push({ ...entry, syncedAt: new Date().toISOString() });
  await AsyncStorage.setItem(SYNC_AUDIT_KEY, JSON.stringify(log.slice(-200)));
}

export async function getUnverifiedDeliveries(): Promise<SyncAuditEntry[]> {
  const raw = await AsyncStorage.getItem(SYNC_AUDIT_KEY);
  if (!raw) return [];
  const log: SyncAuditEntry[] = JSON.parse(raw);
  return log.filter((e) => !e.serverVerified);
}

export async function verifyDeliverySync(deliveryId: number, token: string): Promise<boolean> {
  try {
    const res = await fetch(`https://rumah-keripik.vercel.app/api/courier/deliveries/${deliveryId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    const data = await res.json();
    const verified = data.ok && data.delivery?.status !== undefined;

    const raw = await AsyncStorage.getItem(SYNC_AUDIT_KEY);
    const log: SyncAuditEntry[] = raw ? JSON.parse(raw) : [];
    const idx = log.findIndex((e) => e.deliveryId === deliveryId);
    if (idx !== -1) {
      log[idx].serverVerified = verified;
      await AsyncStorage.setItem(SYNC_AUDIT_KEY, JSON.stringify(log));
    }
    return verified;
  } catch {
    return false;
  }
}

export async function getQueueStatus(): Promise<{ count: number; highPriority: number; needsReview: number }> {
  const queue = await getQueue();
  return {
    count: queue.length,
    highPriority: queue.filter((q) => q.priority === 'high').length,
    needsReview: queue.filter((q) => q.needsReview).length,
  };
}

export async function clearStaleRequests(maxAgeMs = 86400000) {
  const queue = await getQueue();
  const now = Date.now();
  const filtered = queue.filter((req) => now - new Date(req.createdAt).getTime() < maxAgeMs);
  await saveQueue(filtered);
}
