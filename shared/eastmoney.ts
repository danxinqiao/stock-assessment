import type { Direction, KlineBar } from './types';

const KLINE_FIELDS = 'f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61';
const UP_THRESHOLD = 0.1;
const DOWN_THRESHOLD = -0.1;
const CACHE_TTL_MS = 10 * 60 * 1000;

interface EastmoneyKlineResponse {
  rc?: number;
  data?: {
    code?: string;
    name?: string;
    klines?: string[];
  } | null;
}

export async function fetchKlines(secid: string, limit = 30): Promise<KlineBar[]> {
  const url =
    'https://push2his.eastmoney.com/api/qt/stock/kline/get' +
    `?secid=${encodeURIComponent(secid)}` +
    '&klt=101&fqt=1&end=20500101' +
    `&lmt=${limit}` +
    '&fields1=f1,f2,f3,f4,f5,f6' +
    `&fields2=${KLINE_FIELDS}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      Referer: 'https://quote.eastmoney.com/',
    },
    signal: AbortSignal.timeout(6000),
  });

  if (!response.ok) {
    throw new Error(`eastmoney http ${response.status}`);
  }

  const payload = (await response.json()) as EastmoneyKlineResponse;
  const rows = payload.data?.klines;

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('eastmoney returned no klines');
  }

  const bars: KlineBar[] = [];
  for (const row of rows) {
    const cells = row.split(',');
    const date = cells[0];
    const pct = Number(cells[8]);
    if (!date || !Number.isFinite(pct)) continue;
    bars.push({ date, pct });
  }

  if (bars.length === 0) {
    throw new Error('eastmoney klines unparsable');
  }

  return bars;
}

export function classify(pct: number): Direction {
  if (pct > UP_THRESHOLD) return 'up';
  if (pct < DOWN_THRESHOLD) return 'down';
  return 'flat';
}

interface PercentCache {
  key: string;
  at: number;
  map: Map<string, number>;
}

let percentCache: PercentCache | null = null;

/** 日期 -> 当日涨跌幅（%），进程内缓存 10 分钟。 */
export async function getPercentMap(secid: string): Promise<Map<string, number>> {
  const key = `${secid}:500`;
  if (percentCache && percentCache.key === key && Date.now() - percentCache.at < CACHE_TTL_MS) {
    return percentCache.map;
  }

  const bars = await fetchKlines(secid, 500);
  const map = new Map<string, number>();
  for (const bar of bars) map.set(bar.date, bar.pct);

  percentCache = { key, at: Date.now(), map };
  return map;
}
