import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('rumah-keripik-courier.db');
  }
  return db;
}

export async function initDatabase() {
  const database = await getDb();

  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS delivery_cache (
      id INTEGER PRIMARY KEY,
      id_transaksi TEXT NOT NULL,
      kode_pesanan TEXT,
      status TEXT NOT NULL DEFAULT 'Siap_Dikirim',
      customer_name TEXT,
      customer_phone TEXT,
      address TEXT,
      latitude TEXT,
      longitude TEXT,
      distance_km TEXT,
      notes TEXT,
      route_order INTEGER DEFAULT 0,
      created_at TEXT,
      cached_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_delivery_cache_status ON delivery_cache(status);
    CREATE INDEX IF NOT EXISTS idx_delivery_cache_cached ON delivery_cache(cached_at);

    CREATE TABLE IF NOT EXISTS courier_profile_cache (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      vehicle TEXT,
      plat_no TEXT,
      photo_url TEXT,
      cached_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS offline_outbox (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL DEFAULT 'POST',
      payload TEXT,
      token TEXT,
      priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('high','normal')),
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_outbox_priority ON offline_outbox(priority, created_at);
  `);
}

export async function cacheDeliveries(deliveries: any[]) {
  const database = await getDb();
  await database.execAsync('DELETE FROM delivery_cache');
  const stmt = await database.prepareAsync(
    'INSERT INTO delivery_cache (id, id_transaksi, kode_pesanan, status, customer_name, customer_phone, address, latitude, longitude, distance_km, notes, route_order, created_at) VALUES ($id, $id_transaksi, $kode_pesanan, $status, $customer_name, $customer_phone, $address, $latitude, $longitude, $distance_km, $notes, $route_order, $created_at)'
  );
  for (const d of deliveries) {
    await stmt.executeAsync({
      $id: d.id,
      $id_transaksi: d.id_transaksi,
      $kode_pesanan: d.kode_pesanan || null,
      $status: d.status,
      $customer_name: d.customer_name || null,
      $customer_phone: d.customer_phone || null,
      $address: d.address || null,
      $latitude: d.latitude || null,
      $longitude: d.longitude || null,
      $distance_km: d.distance_km || null,
      $notes: d.notes || null,
      $route_order: d.route_order || 0,
      $created_at: d.created_at || null,
    });
  }
  await stmt.finalizeAsync();
}

export async function getCachedDeliveries(status?: string) {
  const database = await getDb();
  if (status) {
    const rows = await database.getAllAsync<any>(
      'SELECT * FROM delivery_cache WHERE status = $status ORDER BY route_order ASC',
      { $status: status }
    );
    return rows;
  }
  const rows = await database.getAllAsync<any>(
    'SELECT * FROM delivery_cache ORDER BY route_order ASC'
  );
  return rows;
}

export async function addToOutbox(endpoint: string, method: string, payload: any, token: string | null, priority: string = 'normal') {
  const database = await getDb();
  await database.runAsync(
    'INSERT INTO offline_outbox (endpoint, method, payload, token, priority) VALUES ($endpoint, $method, $payload, $token, $priority)',
    {
      $endpoint: endpoint,
      $method: method,
      $payload: JSON.stringify(payload),
      $token: token,
      $priority: priority,
    }
  );
}

export async function getOutboxItems(limit: number = 20) {
  const database = await getDb();
  const rows = await database.getAllAsync<any>(
    'SELECT * FROM offline_outbox ORDER BY priority ASC, created_at ASC LIMIT $limit',
    { $limit: limit }
  );
  return rows;
}

export async function removeOutboxItem(id: number) {
  const database = await getDb();
  await database.runAsync('DELETE FROM offline_outbox WHERE id = $id', { $id: id });
}

export async function updateOutboxError(id: number, error: string) {
  const database = await getDb();
  await database.runAsync(
    'UPDATE offline_outbox SET attempts = attempts + 1, last_error = $error WHERE id = $id',
    { $id: id, $error: error }
  );
}
