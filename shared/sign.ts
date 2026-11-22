import type { Env } from './types';

export const TIMESTAMP_HEADER = 'X-Sign-Timestamp';
export const SIGNATURE_HEADER = 'X-Signature';

const DEFAULT_WX_REPLY_URL = 'https://wx.gyegt614.top';

type SignConfig = Pick<Env, 'WX_REPLY_URL' | 'CRON_SECRET' | 'WX_REPLY'>;
type ReplyConfig = { WX_REPLY_URL?: string; WX_REPLY?: Fetcher; CRON_SECRET?: string };

function replyBase(env: ReplyConfig): string {
  return (env.WX_REPLY_URL || DEFAULT_WX_REPLY_URL).replace(/\/+$/, '');
}

async function callReply(env: ReplyConfig, path: string, init: RequestInit): Promise<Response> {
  if (env.WX_REPLY) {
    return env.WX_REPLY.fetch(new Request(`https://wx-reply${path}`, init));
  }
  return fetch(`${replyBase(env)}${path}`, init);
}

/**
 * 把请求携带的毫秒时间戳和签名交给 wx-reply 校验。
 * 优先走内部 service binding，未绑定时回退到公开 URL。
 */
export async function verifyRequestSignature(
  request: Request,
  env: ReplyConfig,
): Promise<boolean> {
  const timestamp = request.headers.get(TIMESTAMP_HEADER);
  const signature = request.headers.get(SIGNATURE_HEADER);
  if (!timestamp || !signature) return false;

  try {
    const response = await callReply(env, '/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Cron-Token': env.CRON_SECRET ?? '',
      },
      body: JSON.stringify({ timestamp, signature }),
    });
    if (!response.ok) return false;
    const data = (await response.json()) as { valid?: boolean };
    return data.valid === true;
  } catch (error) {
    console.error('[sign] verify failed', error);
    return false;
  }
}

/**
 * 从 wx-reply 获取一次签名，用于请求其他 Worker / Pages Function。
 * 失败时返回空对象，调用方可继续使用旧的 X-Cron-Token 兼容。
 */
export async function signHeaders(env: SignConfig): Promise<Record<string, string>> {
  if (!env.CRON_SECRET) return {};

  try {
    const response = await callReply(env, '/sign', {
      method: 'POST',
      headers: { 'X-Cron-Token': env.CRON_SECRET },
    });
    if (!response.ok) {
      console.error(`[sign] /sign -> ${response.status}`);
      return {};
    }
    const data = (await response.json()) as { timestamp?: string; signature?: string };
    if (!data.timestamp || !data.signature) return {};
    return {
      [TIMESTAMP_HEADER]: data.timestamp,
      [SIGNATURE_HEADER]: data.signature,
    };
  } catch (error) {
    console.error('[sign] /sign failed', error);
    return {};
  }
}
