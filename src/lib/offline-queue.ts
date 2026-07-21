import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const QUEUE_KEY = 'offline_request_queue';

interface QueuedRequest {
  id: string;
  path: string;
  method: string;
  body: string;
  token: string | null;
  createdAt: string;
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
) {
  const queue = await getQueue();
  queue.push({
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    path,
    method,
    body: JSON.stringify(body),
    token,
    createdAt: new Date().toISOString(),
  });
  await saveQueue(queue);
}

export async function processQueue() {
  const state = await NetInfo.fetch();
  if (!state.isConnected) return;

  const queue = await getQueue();
  if (queue.length === 0) return;

  const remaining: QueuedRequest[] = [];

  for (const req of queue) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (req.token) headers['Authorization'] = `Bearer ${req.token}`;

      const res = await fetch(`https://rumah-keripik.vercel.app${req.path}`, {
        method: req.method,
        headers,
        body: req.body,
      });

      if (!res.ok) {
        remaining.push(req);
      }
    } catch {
      remaining.push(req);
    }
  }

  await saveQueue(remaining);
}

export async function getQueueLength(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}
