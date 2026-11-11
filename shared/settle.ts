import { cstToday, daysBetween } from './date';
import { deleteJournal, getJournal, updateActual } from './db';
import { classify, fetchKlines } from './eastmoney';
import type { Env, KlineBar, SettleResult } from './types';

const MAX_STALE_DAYS = 10;

export async function settle(env: Env, round: number): Promise<SettleResult> {
  const today = cstToday();

  const row = await getJournal(env.DB, today);
  if (!row) {
    console.log(`[settle r${round}] ${today} no guess, nothing to do`);
    return { outcome: 'no-row', date: today };
  }

  if (row.actual) {
    console.log(`[settle r${round}] ${today} already judged as ${row.actual}`);
    return { outcome: 'already', date: today, actual: row.actual };
  }

  let bars: KlineBar[];
  try {
    bars = await fetchKlines(env.STOCK_SECID, 30);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[settle r${round}] kline fetch failed: ${message}`);
    return { outcome: 'pending', date: today, error: message };
  }

  const bar = bars.find((item) => item.date === today);

  if (bar) {
    const actual = classify(bar.pct);
    await updateActual(env.DB, today, actual);
    console.log(`[settle r${round}] ${today} pct=${bar.pct} => ${actual}`);
    return { outcome: 'settled', date: today, actual, pct: bar.pct };
  }

  const latest = bars[bars.length - 1].date;

  if (round < 3) {
    console.log(`[settle r${round}] ${today} not published yet, latest=${latest}`);
    return { outcome: 'pending', date: today, latest };
  }

  if (daysBetween(latest, today) > MAX_STALE_DAYS) {
    console.error(`[settle r3] kline data stale, latest=${latest}, keeping NULL`);
    return { outcome: 'pending', date: today, latest, error: 'stale kline data' };
  }

  await deleteJournal(env.DB, today);
  console.log(`[settle r3] ${today} absent from klines (latest=${latest}) => holiday, row deleted`);
  return { outcome: 'holiday', date: today, latest };
}
