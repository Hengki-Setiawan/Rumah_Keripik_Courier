import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('rumah-kripik-courier.db');
    await initTables(db);
  }
  return db;
}

async function initTables(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS local_deliveries (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      status TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      is_dirty INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS sync_outbox (
      id TEXT PRIMARY KEY,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      attempt_count INTEGER DEFAULT 0,
      last_attempt_at INTEGER,
      status TEXT DEFAULT 'pending'
    );
    CREATE TABLE IF NOT EXISTS location_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lat REAL, lng REAL, accuracy REAL, speed REAL, heading REAL,
      recorded_at INTEGER NOT NULL,
      delivery_id TEXT,
      synced INTEGER DEFAULT 0
    );
  `);
}

export async function saveDeliveriesOffline(
  deliveries: { id: string; data: string; status: string; updated_at: number }[]
) {
  const database = await getDb();
  const stmt = await database.prepareAsync(
    'INSERT OR REPLACE INTO local_deliveries (id, data, status, updated_at, is_dirty) VALUES ($id, $data, $status, $updated_at, 0)'
  );
  for (const d of deliveries) {
    await stmt.executeAsync({
      $id: d.id,
      $data: d.data,
      $status: d.status,
      $updated_at: d.updated_at,
    });
  }
  await stmt.finalizeAsync();
}

export async function getCachedDeliveries(): Promise<string[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{ data: string }>(
    'SELECT data FROM local_deliveries ORDER BY updated_at DESC'
  );
  return rows.map((r) => r.data);
}

export async function enqueueMutation(
  id: string,
  endpoint: string,
  method: string,
  payload: Record<string, unknown>
) {
  const database = await getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO sync_outbox (id, endpoint, method, payload, created_at, status) VALUES (?, ?, ?, ?, ?, 'pending')`,
    id,
    endpoint,
    method,
    JSON.stringify(payload),
    Date.now()
  );
}

export async function enqueueLocationPoints(
  points: {
    lat: number;
    lng: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    recorded_at: number;
    delivery_id?: string;
  }[]
) {
  const database = await getDb();
  const stmt = await database.prepareAsync(
    'INSERT INTO location_queue (lat, lng, accuracy, speed, heading, recorded_at, delivery_id) VALUES ($lat, $lng, $accuracy, $speed, $heading, $recorded_at, $delivery_id)'
  );
  for (const p of points) {
    await stmt.executeAsync({
      $lat: p.lat,
      $lng: p.lng,
      $accuracy: p.accuracy ?? null,
      $speed: p.speed ?? null,
      $heading: p.heading ?? null,
      $recorded_at: p.recorded_at,
      $delivery_id: p.delivery_id ?? null,
    });
  }
  await stmt.finalizeAsync();
}
