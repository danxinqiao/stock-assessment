import { cstClock, cstToday, weekdayCn } from '../shared/date';
import { setMeta, upsertGuess } from '../shared/db';
import type { Direction, Env } from '../shared/types';
import { textReply, verifySignature, xmlField } from '../shared/wechat';

const LABEL: Record<Direction, string> = { up: '看涨', down: '看跌', flat: '看平' };
const HINT = '回复 101 看涨 · 102 看跌 · 103 看平';

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

function xmlResponse(body: string): Response {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const signature = url.searchParams.get('signature');
  const timestamp = url.searchParams.get('timestamp');
  const nonce = url.searchParams.get('nonce');
  const echostr = url.searchParams.get('echostr');

  if (!signature || !timestamp || !nonce || !echostr) {
    return new Response('stock-assessment wx endpoint', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const ok = await verifySignature(env.WX_TOKEN, timestamp, nonce, signature);
  if (!ok) {
    console.error('[wx] signature mismatch');
    return new Response('signature mismatch', { status: 403 });
  }

  console.log('[wx] url verified');
  return new Response(echostr, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const signature = url.searchParams.get('signature');
  const timestamp = url.searchParams.get('timestamp');
  const nonce = url.searchParams.get('nonce');

  if (!signature || !timestamp || !nonce) {
    return new Response('missing signature', { status: 403 });
  }

  const ok = await verifySignature(env.WX_TOKEN, timestamp, nonce, signature);
  if (!ok) {
    console.error('[wx] post signature mismatch');
    return new Response('signature mismatch', { status: 403 });
  }

  const xml = await request.text();
  const msgType = xmlField(xml, 'MsgType');
  const fromUser = xmlField(xml, 'FromUserName') ?? '';
  const toUser = xmlField(xml, 'ToUserName') ?? '';

  if (msgType === 'event') {
    const event = xmlField(xml, 'Event');
    if (event === 'subscribe' && fromUser) {
      await setMeta(env.DB, 'openid', fromUser);
      console.log(`[wx] subscribe, openid saved: ${fromUser}`);
    }
    return new Response('success', { status: 200 });
  }

  if (msgType !== 'text') {
    return new Response('success', { status: 200 });
  }

  const content = xmlField(xml, 'Content') ?? '';
  const guess = mapGuess(content);

  if (!guess) {
    return xmlResponse(textReply(fromUser, toUser, HINT));
  }

  const { hour } = cstClock();
  if (hour >= 15) {
    console.log('[wx] after 15:00, rejected');
    return xmlResponse(textReply(fromUser, toUser, '今日已截止'));
  }

  const today = cstToday();
  await upsertGuess(env.DB, today, guess);
  const weekday = weekdayCn();
  console.log(`[wx] ${today} ${weekday} guess=${guess}`);

  return xmlResponse(textReply(fromUser, toUser, `已记录：${LABEL[guess]} ✓`));
};
