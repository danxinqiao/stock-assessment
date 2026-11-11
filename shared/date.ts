const CST_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 86_400_000;

const WEEKDAY_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function cstNow(): Date {
  return new Date(Date.now() + CST_OFFSET_MS);
}

export function cstToday(now: Date = cstNow()): string {
  return now.toISOString().slice(0, 10);
}

export function cstClock(now: Date = cstNow()): { hour: number; minute: number } {
  return { hour: now.getUTCHours(), minute: now.getUTCMinutes() };
}

export function weekdayCn(now: Date = cstNow()): string {
  return WEEKDAY_CN[now.getUTCDay()];
}

export function weekdayOf(date: string): string {
  return WEEKDAY_CN[new Date(`${date}T00:00:00Z`).getUTCDay()];
}

export function isWeekend(now: Date = cstNow()): boolean {
  const day = now.getUTCDay();
  return day === 0 || day === 6;
}

export function daysAgo(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) - days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS,
  );
}

export function isoWeek(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const year = d.getUTCFullYear();
  const yearStart = Date.UTC(year, 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / DAY_MS + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

export function rangeStart(range: string, today: string = cstToday()): string | null {
  switch (range) {
    case '7d':
      return daysAgo(today, 6);
    case '90d':
      return daysAgo(today, 89);
    case 'ytd':
      return `${today.slice(0, 4)}-01-01`;
    case 'all':
      return null;
    case '30d':
    default:
      return daysAgo(today, 29);
  }
}
