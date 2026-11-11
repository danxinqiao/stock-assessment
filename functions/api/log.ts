import { cstToday, weekdayOf } from '../../shared/date';
import { listRecent } from '../../shared/db';
import { getPercentMap } from '../../shared/eastmoney';
import { json } from '../../shared/http';
import type { Env } from '../../shared/types';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const TRADING_DAYS_WINDOW = 140;

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const before = url.searchParams.get('before');
  const rawLimit = Number(url.searchParams.get('limit') ?? DEFAULT_LIMIT);
  const limit = Math.min(
    Math.max(Number.isFinite(rawLimit) ? Math.trunc(rawLimit) : DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );

  const rows = await listRecent(env.DB, before, limit);

  let percentMap: Map<string, number> | null = null;
  try {
    percentMap = await getPercentMap(env.STOCK_SECID);
  } catch (error) {
    console.warn('[log] percent unavailable:', error);
  }

  const items = rows.map((row) => ({
    date: row.trade_date,
    weekday: weekdayOf(row.trade_date),
    guess: row.guess,
    actual: row.actual,
    percent: percentMap?.get(row.trade_date) ?? null,
    result: row.actual === null ? 'pending' : row.actual === row.guess ? 'hit' : 'miss',
  }));

  const today = cstToday();
  const tradingDays = percentMap
    ? Array.from(percentMap.keys())
        .filter((date) => date <= today)
        .sort()
        .slice(-TRADING_DAYS_WINDOW)
    : [];

  const next = rows.length === limit ? rows[rows.length - 1].trade_date : null;

  return json({ items, next, tradingDays }, 200, { 'Cache-Control': 'public, max-age=60' });
};
