import { errorJson, isCronAuthorized, json } from '../../../shared/http';
import { sendReminder } from '../../../shared/reminder';
import type { Env } from '../../../shared/types';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!isCronAuthorized(request, env)) {
    return errorJson('Unauthorized', 401);
  }

  try {
    const result = await sendReminder(env);
    if (!result.sent && result.reason?.startsWith('http')) {
      return json(result, 502);
    }
    return json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[cron/remind] failed:', error);
    return errorJson(message, 500);
  }
};
