import type { Direction, JournalRow } from './types';

export async function getMeta(db: D1Database, key: string): Promise<string | null> {
  const row = await db
    .prepare('SELECT value FROM meta WHERE key = ?')
    .bind(key)
    .first<{ value: string }>();
  return row?.value ?? null;
}

export async function setMeta(db: D1Database, key: string, value: string): Promise<void> {
  await db
    .prepare(
      'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    )
    .bind(key, value)
    .run();
}

export async function getJournal(db: D1Database, date: string): Promise<JournalRow | null> {
  return db
    .prepare('SELECT trade_date, guess, actual FROM journal WHERE trade_date = ?')
    .bind(date)
    .first<JournalRow>();
}

export async function upsertGuess(
  db: D1Database,
  date: string,
  guess: Direction,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO journal (trade_date, guess, actual) VALUES (?, ?, NULL)
       ON CONFLICT(trade_date) DO UPDATE SET guess = excluded.guess`,
    )
    .bind(date, guess)
    .run();
}

export async function updateActual(
  db: D1Database,
  date: string,
  actual: Direction,
): Promise<void> {
  await db.prepare('UPDATE journal SET actual = ? WHERE trade_date = ?').bind(actual, date).run();
}

export async function deleteJournal(db: D1Database, date: string): Promise<void> {
  await db.prepare('DELETE FROM journal WHERE trade_date = ?').bind(date).run();
}

export async function recentStats(
  db: D1Database,
  since: string,
): Promise<{ total: number; hit: number }> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(CASE WHEN guess = actual THEN 1 ELSE 0 END), 0) AS hit
         FROM journal
        WHERE actual IS NOT NULL
          AND trade_date >= ?`,
    )
    .bind(since)
    .first<{ total: number; hit: number }>();
  return { total: row?.total ?? 0, hit: row?.hit ?? 0 };
}

/** 已判定的记录，按日期升序；from 为 null 时取全部。 */
export async function listJudged(db: D1Database, from: string | null): Promise<JournalRow[]> {
  const sql = from
    ? 'SELECT trade_date, guess, actual FROM journal WHERE actual IS NOT NULL AND trade_date >= ? ORDER BY trade_date ASC'
    : 'SELECT trade_date, guess, actual FROM journal WHERE actual IS NOT NULL ORDER BY trade_date ASC';
  const stmt = from ? db.prepare(sql).bind(from) : db.prepare(sql);
  const result = await stmt.all<JournalRow>();
  return result.results ?? [];
}

/** 最近一天往前，用于算连胜。 */
export async function listJudgedDesc(db: D1Database, limit = 200): Promise<JournalRow[]> {
  const result = await db
    .prepare(
      'SELECT trade_date, guess, actual FROM journal WHERE actual IS NOT NULL ORDER BY trade_date DESC LIMIT ?',
    )
    .bind(limit)
    .all<JournalRow>();
  return result.results ?? [];
}

/** 明细页：取 trade_date < before 的记录，倒序。 */
export async function listRecent(
  db: D1Database,
  before: string | null,
  limit: number,
): Promise<JournalRow[]> {
  const sql = before
    ? 'SELECT trade_date, guess, actual FROM journal WHERE trade_date < ? ORDER BY trade_date DESC LIMIT ?'
    : 'SELECT trade_date, guess, actual FROM journal ORDER BY trade_date DESC LIMIT ?';
  const stmt = before ? db.prepare(sql).bind(before, limit) : db.prepare(sql).bind(limit);
  const result = await stmt.all<JournalRow>();
  return result.results ?? [];
}

export async function earliestJudgedDate(db: D1Database): Promise<string | null> {
  const row = await db
    .prepare('SELECT MIN(trade_date) AS d FROM journal WHERE actual IS NOT NULL')
    .first<{ d: string | null }>();
  return row?.d ?? null;
}
