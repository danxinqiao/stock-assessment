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

/** 东财 secid（如 1.000001）→ 腾讯 symbol（如 sh000001）。 */
function tencentSymbol(secid: string): string {
  if (secid.startsWith('0.')) return `sz${secid.slice(2)}`;
  if (secid.startsWith('1.')) return `sh${secid.slice(2)}`;
  return secid.replace('.', '');
}

interface TencentFqklineResponse {
  code?: number;
  data?: Record<string, { day?: string[][]; qfqday?: string[][] }> | null;
}

/** 腾讯日K兜底：涨跌幅 = 相邻收盘价变化率（指数无复权差异）。 */
async function fetchTencentKlines(secid: string, limit: number): Promise<KlineBar[]> {
  const symbol = tencentSymbol(secid);
  const url =
    `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get` +
    `?param=${symbol},day,,,${limit},qfq`;

  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      Referer: 'https://gu.qq.com/',
    },
    signal: AbortSignal.timeout(6000),
  });

  if (!response.ok) {
    throw new Error(`tencent http ${response.status}`);
  }

  const payload = (await response.json()) as TencentFqklineResponse;
  const node = payload.data?.[symbol];
  const rows = node?.qfqday ?? node?.day;

  if (!Array.isArray(rows) || rows.length < 2) {
    throw new Error('tencent returned no klines');
  }

  const bars: KlineBar[] = [];
  for (let i = 1; i < rows.length; i += 1) {
    const close = Number(rows[i][2]);
    const prev = Number(rows[i - 1][2]);
    if (!Number.isFinite(close) || !Number.isFinite(prev) || prev === 0) continue;
    bars.push({ date: rows[i][0], pct: ((close - prev) / prev) * 100 });
  }

  if (bars.length === 0) {
    throw new Error('tencent klines unparsable');
  }

  return bars;
}

export async function fetchKlines(secid: string, limit = 30): Promise<KlineBar[]> {
  let eastmoneyError: unknown;
  try {
    return await fetchEastmoneyKlines(secid, limit);
  } catch (error) {
    eastmoneyError = error;
    console.warn(`[eastmoney] primary failed, fallback to tencent: ${String(error)}`);
  }
  try {
    return await fetchTencentKlines(secid, limit);
  } catch (tencentError) {
    const em = eastmoneyError instanceof Error ? eastmoneyError.message : String(eastmoneyError);
    const tx = tencentError instanceof Error ? tencentError.message : String(tencentError);
    throw new Error(`kline sources failed: eastmoney(${em}); tencent(${tx})`);
  }
}

async function fetchEastmoneyKlines(secid: string, limit: number): Promise<KlineBar[]> {
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
