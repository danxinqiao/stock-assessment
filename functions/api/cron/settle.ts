import { errorJson, isCronAuthorized, json } from '../../../shared/http';
import { settle } from '../../../shared/settle';
import type { Env } from '../../../shared/types';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!isCronAuthorized(request, env)) {
    return errorJson('Unauthorized', 401);
  }

  let body: { round?: number } = {};
  try {
    body = (await request.json()) as { round?: number };
  } catch {
    body = {};
  }

  const round = Number(body.round ?? 3);
  if (![1, 2, 3].includes(round)) {
    return errorJson('round must be 1, 2 or 3', 400);
  }

  try {
    const result = await settle(env, round);
    return json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[cron/settle] failed:', error);
    return errorJson(message, 500);
  }
};
