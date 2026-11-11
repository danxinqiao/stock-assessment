export type Direction = 'up' | 'down' | 'flat';
export type ResultKind = 'hit' | 'miss' | 'pending' | 'none';

export interface TodayResponse {
  date: string;
  weekday: string;
  guess: Direction | null;
  actual: Direction | null;
  percent: number | null;
  result: ResultKind;
  reminded: boolean;
}

export interface DirectionStat {
  total: number;
  hit: number;
  accuracy: number | null;
}

export interface StatsResponse {
  range: string;
  from: string | null;
  to: string;
  total: number;
  hit: number;
  accuracy: number | null;
  binary: DirectionStat;
  streak: number;
  byGuess: Record<Direction, DirectionStat>;
  matrix: Record<Direction, Record<Direction, number>>;
  weekly: { week: string; total: number; hit: number; accuracy: number | null }[];
}

export interface LogItem {
  date: string;
  weekday: string;
  guess: Direction;
  actual: Direction | null;
  percent: number | null;
  result: 'hit' | 'miss' | 'pending';
}

export interface LogResponse {
  items: LogItem[];
  next: string | null;
  tradingDays: string[];
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`${url} -> ${response.status}`);
  }
  return (await response.json()) as T;
}

export const api = {
  today: () => getJson<TodayResponse>('/api/today'),
  stats: (range: string) => getJson<StatsResponse>(`/api/stats?range=${encodeURIComponent(range)}`),
  log: (before?: string | null) =>
    getJson<LogResponse>(`/api/log?limit=50${before ? `&before=${encodeURIComponent(before)}` : ''}`),
};
