export type Direction = 'up' | 'down' | 'flat';

export interface JournalRow {
  trade_date: string;
  guess: Direction;
  actual: Direction | null;
}

export interface KlineBar {
  date: string;
  pct: number;
}

export interface Env {
  DB: D1Database;
  STOCK_SECID: string;
  WX_PUSH_URL: string;
  WECHAT_TOKEN: string;
  CRON_SECRET: string;
  WX_REPLY_URL: string;
  WX_REPLY?: Fetcher;
  FLAGSHIP_ACCOUNT_ID?: string;
  FLAGSHIP_API_TOKEN?: string;
}

export interface ReminderResult {
  sent: boolean;
  reason?: string;
  msgid?: number;
  date: string;
  tip?: string;
  openid?: string;
}

export type SettleOutcome = 'no-row' | 'already' | 'settled' | 'holiday' | 'pending';

export interface SettleResult {
  outcome: SettleOutcome;
  date: string;
  actual?: string;
  pct?: number;
  latest?: string;
  error?: string;
}
