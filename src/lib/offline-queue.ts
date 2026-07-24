import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const QUEUE_KEY = 'offline_request_queue';

export type QueuePriority = 'high' | 'normal';
export type QueueType = 'STATUS_UPDATE' | 'LOCATION_PING' | 'PROOF_UPLOAD' | 'OFFER_RESPONSE';

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
}

async function getQueue(): Promise<QueuedRequest[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveQueue(queue: QueuedRequest[]) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
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
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
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
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (req.token) headers['Authorization'] = `Bearer ${req.token}`;

      const res = await fetch(`https://rumah-keripik.vercel.app${req.path}`, {
        method: req.method,
        headers,
        body: req.body,
      });

      if (res.ok || res.status === 409) {
        if (req.type !== 'LOCATION_PING' || processed.filter((p) => p.type === 'LOCATION_PING').length === 0) {
          processed.push(req);
        }
        continue;
      }

      req.attempts++;
      req.lastError = `HTTP ${res.status}`;
      if (req.attempts < 5) {
        failed.push(req);
      }
    } catch (err) {
      req.attempts++;
      req.lastError = String(err);
      if (req.attempts < 5) {
        failed.push(req);
      }
    }
  }

  const remaining = [...failed, ...queue.filter((q) => !sorted.includes(q))];
  await saveQueue(remaining);
}

export async function getQueueStatus(): Promise<{ count: number; highPriority: number }> {
  const queue = await getQueue();
  return { count: queue.length, highPriority: queue.filter((q) => q.priority === 'high').length };
}
