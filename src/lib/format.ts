import type { Direction } from './api';

export const GUESS_LABEL: Record<Direction, string> = {
  up: '看涨',
  down: '看跌',
  flat: '看平',
};

export const ACTUAL_LABEL: Record<Direction, string> = {
  up: '涨',
  down: '跌',
  flat: '平',
};

const WEEKDAY = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function rateText(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${(value * 100).toFixed(1)}%`;
}

export function signedPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function weekdayOf(date: string): string {
  return WEEKDAY[new Date(`${date}T00:00:00Z`).getUTCDay()];
}

export function monthOf(date: string): number {
  return Number(date.slice(5, 7));
}

export function mondayOf(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

export function dayIndex(date: string): number {
  return (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
}

export function shortDate(date: string): string {
  return date.slice(5);
}
