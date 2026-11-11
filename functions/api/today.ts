import { cstToday, weekdayCn } from '../../shared/date';
import { getJournal, getMeta } from '../../shared/db';
import { getPercentMap } from '../../shared/eastmoney';
import { json } from '../../shared/http';
import type { Env } from '../../shared/types';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const today = cstToday();
  const [row, lastRemind] = await Promise.all([
    getJournal(env.DB, today),
    getMeta(env.DB, 'last_remind_date'),
  ]);

  let percent: number | null = null;
  if (row?.actual) {
    try {
      const map = await getPercentMap(env.STOCK_SECID);
      percent = map.get(today) ?? null;
    } catch (error) {
      console.warn('[today] percent unavailable:', error);
    }
  }

  const result = !row
    ? 'none'
    : row.actual
      ? row.actual === row.guess
        ? 'hit'
        : 'miss'
      : 'pending';

  return json(
    {
      date: today,
      weekday: weekdayCn(),
      guess: row?.guess ?? null,
      actual: row?.actual ?? null,
      percent,
      result,
      reminded: lastRemind === today,
    },
    200,
    { 'Cache-Control': 'no-store' },
  );
};
