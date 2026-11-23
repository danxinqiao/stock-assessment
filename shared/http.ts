import { verifyRequestSignature } from './sign';

export function json(
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders },
  });
}

export function errorJson(message: string, status: number): Response {
  return json({ error: message }, status);
}

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * 只接受 wx-reply 签名，不再兼容旧的 X-Cron-Token。
 */
export async function isRequestAuthorized(
  request: Request,
  env: { WX_REPLY_URL?: string; WX_REPLY?: Fetcher; CRON_SECRET?: string },
): Promise<boolean> {
  return verifyRequestSignature(request, env);
}
