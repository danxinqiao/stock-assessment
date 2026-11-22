import { FlagshipClient } from '@cloudflare/flagship';
import type { Env } from './types';

const APP_ID = '6923e3f6-6566-4196-80c4-8715adcdb461';
const CACHE_TTL_MS = 30_000;
const KEYS = [
  'CRON_SECRET',
  'STOCK_SECID',
  'WX_PUSH_URL',
  'WX_REPLY_URL',
  'WECHAT_TOKEN',
] as const;

type ConfigKey = (typeof KEYS)[number];

let client: FlagshipClient | null = null;
let cache: { at: number; values: Partial<Record<ConfigKey, string>> } | null = null;

function getClient(env: Env): FlagshipClient {
  if (!client) {
    client = new FlagshipClient({
      appId: APP_ID,
      accountId: env.FLAGSHIP_ACCOUNT_ID!,
      authToken: env.FLAGSHIP_API_TOKEN!,
      logging: false,
    });
  }
  return client;
}

/**
 * Pages Functions 没有 Flagship 绑定，这里用 Flagship HTTP 客户端读取
 * 同一个 app。缺少引导凭据或读取失败时回退到原 env。
 */
export async function loadEnv(env: Env): Promise<Env> {
  if (!env.FLAGSHIP_ACCOUNT_ID || !env.FLAGSHIP_API_TOKEN) return env;
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return { ...env, ...cache.values };
  }

  try {
    const flagship = getClient(env);
    const values: Partial<Record<ConfigKey, string>> = {};

    await Promise.all(
      KEYS.map(async (key) => {
        try {
          const result = await flagship.evaluate(key, { targetingKey: 'stock-assessment' });
          if (typeof result.value === 'string') values[key] = result.value;
          else if (result.value !== null && result.value !== undefined) {
            values[key] = String(result.value);
          }
        } catch (error) {
          console.warn(`[flags] ${key} unavailable, using env`, error);
        }
      }),
    );

    cache = { at: Date.now(), values };
    return { ...env, ...values };
  } catch (error) {
    console.error('[flags] load failed, using env', error);
    return env;
  }
}
