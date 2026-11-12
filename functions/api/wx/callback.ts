import { cstClock, cstToday } from '../../../shared/date';
import { setMeta, upsertGuess } from '../../../shared/db';
import { isCronAuthorized, json } from '../../../shared/http';
import type { Direction, Env } from '../../../shared/types';

const LABEL: Record<Direction, string> = { up: '看涨', down: '看跌', flat: '看平' };
const HINT = '回复 101 看涨 · 102 看跌 · 103 看平';

/** content 是 wx-reply 原样转发的用户输入；101/102/103 命中，其余 10xxx 未定义 */
function mapGuess(content: string): Direction | null {
  switch (content.trim()) {
    case '101':
      return 'up';
    case '102':
      return 'down';
    case '103':
      return 'flat';
    default:
      return null;
  }
}

interface WxCallbackBody {
  type?: string;
  openid?: string;
  content?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!isCronAuthorized(request, env)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  let body: WxCallbackBody;
  try {
    body = (await request.json()) as WxCallbackBody;
  } catch {
    return json({ error: 'invalid json' }, 400);
  }

  if (!body.type || !body.openid) {
    return json({ error: 'type and openid are required' }, 400);
  }

  // 关注事件：openid 写 meta，回 null（Worker 回 success）
  if (body.type === 'subscribe') {
    await setMeta(env.DB, 'openid', body.openid);
    console.log(`[wx/callback] subscribe, openid saved: ${body.openid}`);
    return json({ reply: null });
  }

  if (body.type !== 'text') {
    return json({ error: 'unsupported type' }, 400);
  }

  const content = (body.content ?? '').trim();

  // 10xxx 且不是 101/102/103：未定义，先按提示语回
  if (!/^10/.test(content)) {
    return json({ error: 'unsupported content' }, 400);
  }

  const guess = mapGuess(content);

  if (!guess) {
    console.log(`[wx/callback] undefined 10xxx: ${content}`);
    return json({ reply: HINT });
  }

  const { hour } = cstClock();
  if (hour >= 15) {
    console.log('[wx/callback] after 15:00, rejected');
    return json({ reply: '今日已截止' });
  }

  const today = cstToday();
  await upsertGuess(env.DB, today, guess);
  console.log(`[wx/callback] ${today} guess=${guess} (openid=${body.openid})`);

  return json({ reply: `已记录：${LABEL[guess]} ✓` });
};
