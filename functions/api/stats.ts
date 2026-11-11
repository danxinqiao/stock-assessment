import { cstToday, isoWeek, rangeStart } from '../../shared/date';
import { listJudged, listJudgedDesc } from '../../shared/db';
import { json } from '../../shared/http';
import type { Direction, Env, JournalRow } from '../../shared/types';

const DIRS: Direction[] = ['up', 'down', 'flat'];

function rate(hit: number, total: number): number | null {
  return total === 0 ? null : Number((hit / total).toFixed(3));
}

function emptyMatrix(): Record<Direction, Record<Direction, number>> {
  return {
    up: { up: 0, down: 0, flat: 0 },
    down: { up: 0, down: 0, flat: 0 },
    flat: { up: 0, down: 0, flat: 0 },
  };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const range = new URL(request.url).searchParams.get('range') ?? '30d';
  const today = cstToday();
  const from = rangeStart(range, today);

  const [rows, recent] = await Promise.all([
    listJudged(env.DB, from),
    listJudgedDesc(env.DB, 200),
  ]);

  const total = rows.length;
  const hit = rows.filter((row) => row.guess === row.actual).length;

  const binaryRows = rows.filter((row) => row.actual !== 'flat');
  const binaryHit = binaryRows.filter((row) => row.guess === row.actual).length;

  const byGuess = {} as Record<Direction, { total: number; hit: number; accuracy: number | null }>;
  for (const dir of DIRS) {
    const subset = rows.filter((row) => row.guess === dir);
    const dirHit = subset.filter((row) => row.guess === row.actual).length;
    byGuess[dir] = { total: subset.length, hit: dirHit, accuracy: rate(dirHit, subset.length) };
  }

  const matrix = emptyMatrix();
  for (const row of rows) {
    if (!row.actual) continue;
    matrix[row.guess][row.actual] += 1;
  }

  const weeklyMap = new Map<string, { total: number; hit: number }>();
  for (const row of rows) {
    const week = isoWeek(row.trade_date);
    const bucket = weeklyMap.get(week) ?? { total: 0, hit: 0 };
    bucket.total += 1;
    if (row.guess === row.actual) bucket.hit += 1;
    weeklyMap.set(week, bucket);
  }

  const weekly = Array.from(weeklyMap.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([week, bucket]) => ({
      week,
      total: bucket.total,
      hit: bucket.hit,
      accuracy: rate(bucket.hit, bucket.total),
    }));

  let streak = 0;
  for (const row of recent) {
    if (row.guess === row.actual) streak += 1;
    else break;
  }

  return json(
    {
      range,
      from,
      to: today,
      total,
      hit,
      accuracy: rate(hit, total),
      binary: { total: binaryRows.length, hit: binaryHit, accuracy: rate(binaryHit, binaryRows.length) },
      streak,
      byGuess,
      matrix,
      weekly,
    },
    200,
    { 'Cache-Control': 'public, max-age=60' },
  );
};
