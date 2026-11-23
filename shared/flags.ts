import { OpenFeature } from '@openfeature/server-sdk';
import { FlagshipServerProvider } from '@cloudflare/flagship/server';
import type { Env } from './types';

const APP_ID = '6923e3f6-6566-4196-80c4-8715adcdb461';
const REFRESH_INTERVAL_MS = 30_000;
const CONTEXT = { targetingKey: 'stock-assessment' };
const KEYS = [
  'CRON_SECRET',
  'STOCK_SECID',
  'WX_PUSH_URL',
  'WX_REPLY_URL',
  'WECHAT_TOKEN',
] as const;

type ConfigKey = (typeof KEYS)[number];

let providerReady: Promise<void> | null = null;

function initProvider(env: Env): Promise<void> {
  if (!providerReady) {
    providerReady = OpenFeature.setProviderAndWait(
      new FlagshipServerProvider({
        appId: APP_ID,
        accountId: env.FLAGSHIP_ACCOUNT_ID!,
        authToken: env.FLAGSHIP_API_TOKEN!,
        // 下载一次定义后在本地评估，仅按 refreshInterval 惰性刷新
        localEvaluation: true,
        refreshInterval: REFRESH_INTERVAL_MS,
        logging: false,
      }),
    ).catch((error) => {
      providerReady = null;
      throw error;
    });
  }
  return providerReady;
}

/**
 * Pages Functions 没有 Flagship 绑定，改用 OpenFeature server provider
 * 的本地评估模式读取同一个 app。缺少引导凭据或初始化失败时回退到 env。
 */
export async function loadEnv(env: Env): Promise<Env> {
  if (!env.FLAGSHIP_ACCOUNT_ID || !env.FLAGSHIP_API_TOKEN) return env;

  try {
    await initProvider(env);
  } catch (error) {
    console.error('[flags] provider unavailable, using env', error);
    return env;
  }

  const client = OpenFeature.getClient();
  const values: Partial<Record<ConfigKey, string>> = {};

  await Promise.all(
    KEYS.map(async (key) => {
      try {
        const value = await client.getStringValue(key, env[key] ?? '', CONTEXT);
        if (value) values[key] = value;
      } catch (error) {
        console.warn(`[flags] ${key} unavailable, using env`, error);
      }
    }),
  );

  return { ...env, ...values };
}
