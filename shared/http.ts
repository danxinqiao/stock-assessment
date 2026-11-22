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

export function isCronAuthorized(
  request: Request,
  env: { CRON_SECRET?: string },
): boolean {
  const secret = env.CRON_SECRET;
  if (!secret) return false;
  const token = request.headers.get('X-Cron-Token') ?? '';
  return token.length > 0 && safeEqual(token, secret);
}

/**
 * 优先校验 wx-reply 签名，失败时兼容旧的 X-Cron-Token。
 */
export async function isRequestAuthorized(
  request: Request,
  env: { CRON_SECRET?: string; WX_REPLY_URL?: string },
): Promise<boolean> {
  if (await verifyRequestSignature(request, env)) return true;
  return isCronAuthorized(request, env);
}
