import * as SQLite from 'expo-sqlite';
import { getDb } from './local-schema';
import { getToken } from '../lib/storage';
import { useSyncStore } from '../store/sync-store';

interface OutboxItem {
  id: string;
  endpoint: string;
  method: string;
  payload: string;
  created_at: number;
  attempt_count: number;
  status: string;
}

function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError && err.message === 'Network request failed') return true;
  if (err instanceof Error && err.message.includes('Network')) return true;
  if (err instanceof Error && err.message.includes('ERR_NETWORK')) return true;
  return false;
}

async function getOutboxPending(): Promise<OutboxItem[]> {
  const database = await getDb();
  return database.getAllAsync<OutboxItem>(
    "SELECT * FROM sync_outbox WHERE status = 'pending' ORDER BY created_at ASC"
  );
}

async function markDone(id: string) {
  const database = await getDb();
  await database.runAsync("DELETE FROM sync_outbox WHERE id = ?", id);
}

async function markFailed(id: string, message: string) {
  const database = await getDb();
  await database.runAsync(
    "UPDATE sync_outbox SET status = 'failed', last_attempt_at = ? WHERE id = ?",
    Date.now(),
    id
  );
}

async function incrementAttempt(id: string) {
  const database = await getDb();
  await database.runAsync(
    'UPDATE sync_outbox SET attempt_count = attempt_count + 1, last_attempt_at = ? WHERE id = ?',
    Date.now(),
    id
  );
}

export async function getPendingCount(): Promise<number> {
  const database = await getDb();
  const row = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM sync_outbox WHERE status = 'pending'"
  );
  return row?.count ?? 0;
}

export async function getUnsyncedLocationCount(): Promise<number> {
  const database = await getDb();
  const row = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM location_queue WHERE synced = 0'
  );
  return row?.count ?? 0;
}

export async function getPendingLocations(): Promise<{
  lat: number;
  lng: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  recorded_at: number;
  delivery_id: string | null;
}[]> {
  const database = await getDb();
  return database.getAllAsync(
    'SELECT lat, lng, accuracy, speed, heading, recorded_at, delivery_id FROM location_queue WHERE synced = 0 ORDER BY recorded_at ASC'
  );
}

export async function markLocationsSynced(ids: number[]) {
  const database = await getDb();
  const placeholders = ids.map(() => '?').join(',');
  await database.runAsync(
    `UPDATE location_queue SET synced = 1 WHERE id IN (${placeholders})`,
    ...ids
  );
}

export async function processSyncQueue() {
  const token = await getToken();
  if (!token) return;

  const pending = await getOutboxPending();
  for (const item of pending) {
    try {
      const res = await fetch(item.endpoint, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Client-Mutation-Id': item.id,
        },
        body: item.payload,
      });
      if (res.ok) {
        await markDone(item.id);
      } else if (res.status >= 400 && res.status < 500) {
        const body = await res.json().catch(() => ({}));
        await markFailed(item.id, body?.error?.message ?? `HTTP ${res.status}`);
      } else {
        await incrementAttempt(item.id);
      }
    } catch (err) {
      if (isNetworkError(err)) {
        await incrementAttempt(item.id);
      } else {
        await markFailed(item.id, String(err));
      }
      break;
    }
  }

  const count = await getPendingCount();
  useSyncStore.getState().setPendingCount(count);
  useSyncStore.getState().setLastSync(Date.now());
}
