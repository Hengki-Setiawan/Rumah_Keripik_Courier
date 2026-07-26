import * as SQLite from 'expo-sqlite'

let db: SQLite.SQLiteDatabase | null = null

export async function getDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('rumah_keripik_courier.db')
    await initTables()
  }
  return db
}

async function initTables() {
  if (!db) return
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS cached_deliveries (
      id INTEGER PRIMARY KEY,
      customer_name TEXT,
      customer_phone TEXT,
      address TEXT,
      lat REAL,
      lng REAL,
      total_amount INTEGER,
      status TEXT,
      notes TEXT,
      route_order INTEGER,
      cached_at TEXT DEFAULT (datetime('now', 'utc'))
    );
    CREATE TABLE IF NOT EXISTS offline_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'utc')),
      synced_at TEXT
    );
    CREATE TABLE IF NOT EXISTS gps_cache (
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      accuracy REAL,
      speed REAL,
      timestamp INTEGER NOT NULL
    );
  `)
}

export async function cacheDeliveries(deliveries: Array<{
  id: number; customer_name: string; customer_phone?: string; address?: string; lat?: number; lng?: number; total_amount?: number; status?: string; notes?: string; route_order?: number
}>) {
  const d = await getDb()
  for (const item of deliveries) {
    await d.runAsync(
      `INSERT OR REPLACE INTO cached_deliveries (id, customer_name, customer_phone, address, lat, lng, total_amount, status, notes, route_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      item.id, item.customer_name, item.customer_phone || null, item.address || null, item.lat || null, item.lng || null, item.total_amount || null, item.status || null, item.notes || null, item.route_order || null
    )
  }
}

export async function getCachedDeliveries(): Promise<Array<Record<string, unknown>>> {
  const d = await getDb()
  const rows = await d.getAllAsync('SELECT * FROM cached_deliveries ORDER BY route_order ASC')
  return rows as Array<Record<string, unknown>>
}

export async function clearCache() {
  const d = await getDb()
  await d.execAsync('DELETE FROM cached_deliveries; DELETE FROM offline_events; DELETE FROM gps_cache')
}

export async function saveOfflineEvent(eventType: string, payload: unknown) {
  const d = await getDb()
  await d.runAsync('INSERT INTO offline_events (event_type, payload) VALUES (?, ?)', eventType, JSON.stringify(payload))
}

export async function getUnsyncedEvents() {
  const d = await getDb()
  const rows = await d.getAllAsync('SELECT * FROM offline_events WHERE synced_at IS NULL ORDER BY created_at ASC')
  return rows as Array<Record<string, unknown>>
}

export async function markEventsSynced(ids: number[]) {
  if (ids.length === 0) return
  const d = await getDb()
  const placeholders = ids.map(() => '?').join(',')
  await d.runAsync(`UPDATE offline_events SET synced_at = datetime('now', 'utc') WHERE id IN (${placeholders})`, ...ids)
}