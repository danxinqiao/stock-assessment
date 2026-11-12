import { cstNow, cstToday, daysAgo, isWeekend, weekdayCn } from './date';
import { getMeta, recentStats, setMeta } from './db';
import type { Env, ReminderResult } from './types';

export async function sendReminder(env: Env): Promise<ReminderResult> {
  const now = cstNow();
  const today = cstToday(now);

  if (isWeekend(now)) {
    console.log('[remind] weekend, skipped');
    return { sent: false, reason: 'weekend', date: today };
  }

  const openid = await getMeta(env.DB, 'openid');
  if (!openid) {
    console.error('[remind] meta.openid missing');
    return { sent: false, reason: 'no openid', date: today };
  }

  const stats = await recentStats(env.DB, daysAgo(today, 30));
  const tip =
    stats.total > 0
      ? `15:00 截止 · 近30天 ${((stats.hit / stats.total) * 100).toFixed(1)}%（${stats.hit}/${stats.total}）`
      : '15:00 截止 · 暂无历史';

  const payload = {
    openid,
    date: `${today} ${weekdayCn(now)}`,
    operate: '回复 101 看涨 · 102 看跌 · 103 看平',
    tip,
  };

  const base = env.WX_PUSH_URL.replace(/\/+$/, '');
  const response = await fetch(`${base}/stock-remind`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Supabase wx-push 的 validateToken 是裸比较：authHeader === WECHAT_API_TOKEN
      Authorization: env.WX_PUSH_TOKEN,
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();

  if (!response.ok) {
    console.error(`[remind] push failed ${response.status}: ${text.slice(0, 300)}`);
    return { sent: false, reason: `http ${response.status}`, date: today, tip, openid };
  }

  let msgid: number | undefined;
  try {
    msgid = (JSON.parse(text) as { msgid?: number }).msgid;
  } catch {
    console.warn(`[remind] unexpected response: ${text.slice(0, 200)}`);
  }

  await setMeta(env.DB, 'last_remind_date', today);
  console.log(`[remind] sent ${today} msgid=${msgid}`);

  return { sent: true, msgid, date: today, tip, openid };
}
