import * as SQLite from 'expo-sqlite';

let db;

export async function initDB() {
  db = await SQLite.openDatabaseAsync('datalake.db');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      confidence INTEGER NOT NULL,
      liveness INTEGER DEFAULT 0,
      synced INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS enrolled (
      user_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      department TEXT,
      enrolled_at TEXT NOT NULL,
      embedding TEXT NOT NULL
    );
  `);
}

export async function enrollUser({ userId, name, department, embedding }) {
  await db.runAsync(
    `INSERT OR REPLACE INTO enrolled (user_id, name, department, enrolled_at, embedding)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, name, department || '', new Date().toISOString(), JSON.stringify(embedding)]
  );
}

export async function getEnrolled() {
  const rows = await db.getAllAsync(`SELECT * FROM enrolled`);
  return rows.map(r => ({ ...r, embedding: JSON.parse(r.embedding) }));
}

export async function deleteEnrolled(userId) {
  await db.runAsync(`DELETE FROM enrolled WHERE user_id = ?`, [userId]);
}

export async function logAttendance({ userId, name, confidence, liveness }) {
  await db.runAsync(
    `INSERT INTO attendance (user_id, name, timestamp, confidence, liveness)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, name, new Date().toISOString(), confidence, liveness ? 1 : 0]
  );
}

export async function getAttendance() {
  return db.getAllAsync(`SELECT * FROM attendance ORDER BY timestamp DESC LIMIT 50`);
}

export async function getStats() {
  const [total] = await db.getAllAsync(`SELECT COUNT(*) as c FROM attendance`);
  const [unsynced] = await db.getAllAsync(`SELECT COUNT(*) as c FROM attendance WHERE synced=0`);
  const [users] = await db.getAllAsync(`SELECT COUNT(*) as c FROM enrolled`);
  return {
    total: total.c,
    unsynced: unsynced.c,
    users: users.c,
  };
}
