# stock-assessment

记录并统计自己每天对上证指数涨跌的判断。

- 前端：Vite + React + TypeScript + Tailwind + Recharts
- 接口：Cloudflare Pages Functions
- 存储：Cloudflare D1（`journal`、`meta`）
- 微信推送：Supabase Edge Function `wx-push` 的 `/stock-remind`（另一个仓库）
- 定时触发：Cloudflare Worker `worker-cron`（另一个仓库）

## 目录

```
functions/
  wx.ts                  # 过渡版 /wx（迁到 wx-reply Worker 后，M2-d 删除）
  api/
    wx/callback.ts       # wx-reply → 业务：落库/截止/文案（新增）
    today.ts             # 今日状态
    stats.ts             # 区间统计
    log.ts               # 明细分页 + 交易日集合
    cron/remind.ts       # 09:00 提醒（Worker cron 调用）
    cron/settle.ts       # 收盘判定（Worker cron 调用）
shared/                  # 只给 Functions 用的业务模块
  date.ts db.ts eastmoney.ts wechat.ts http.ts reminder.ts settle.ts types.ts
src/                     # React 页面
  App.tsx pages/StatsPage.tsx pages/LogPage.tsx components/ lib/
migrations/0001_init.sql
wrangler.toml
```

## 准备

```bash
npm install

# 建库，把输出的 database_id 填进 wrangler.toml
wrangler d1 create stock-journal

# 建表
wrangler d1 execute stock-journal --remote --file=./migrations/0001_init.sql

# 三个 secret（值见方案文档）
wrangler pages secret put CRON_SECRET   # worker-cron 与 wx-reply 调 Pages 内部接口共用
wrangler pages secret put WX_PUSH_TOKEN   # Supabase 的 WECHAT_API_TOKEN 原值，不带 Bearer 前缀
# WX_TOKEN 配在 wx-reply Worker（wrangler secret put WX_TOKEN），Pages 不再需要
```

微信后台「服务器配置」：

| 字段 | 值 |
|---|---|
| URL | `https://stock.gyegt614.top/wx` |
| Token | 与 `WX_TOKEN` 一致 |
| 加解密方式 | 明文 |

## 本地开发

```bash
npm run dev            # 只跑前端，/api 不可用
npm run build          # 产物在 dist
wrangler pages dev dist   # 前后端一起跑，绑定读 wrangler.toml
```

## 部署

推到 GitHub，在 Cloudflare Pages 里连这个仓库：

- Build command：`npm run build`
- Output directory：`dist`
- 环境变量 / D1 绑定：按 `wrangler.toml`（也可在 Pages 面板里配）

需要创建cloudflare的token

## 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/wx` | 微信验签（过渡版，迁到 wx-reply Worker 后在 M2-d 删除） |
| POST | `/wx` | 收消息（同上，过渡保留） |
| POST | `/api/wx/callback` | wx-reply → 业务：收 `{type, openid, content}`，回 `{reply}`，需 `X-Cron-Token` |
| GET | `/api/today` | 今日状态 |
| GET | `/api/stats?range=7d\|30d\|90d\|ytd\|all` | 区间统计 |
| GET | `/api/log?before=YYYY-MM-DD&limit=50` | 明细 + `tradingDays` |
| POST | `/api/cron/remind` | 09:00 提醒，需 `X-Cron-Token` |
| POST | `/api/cron/settle` | 收盘判定，需 `X-Cron-Token`，body `{"round":1..3}` |

## 行为约定

- 回复窗口 09:00–15:00，15:00 后回「今日已截止」，不写库。
- 指令码：`101` 看涨 / `102` 看跌 / `103` 看平；其他 `10xxx` 回提示语。`20xxx`/`30xxx` 由 wx-reply 路由到预留目标（Pages 不处理）。
- 未回复不写行，不进准确率分母。
- 收盘判定跑三轮（15:10 / 15:40 / 16:30）；第三轮仍无当日 K 线 → 视为休市，删掉当天这行。
- 行情接口三轮都失败 → 保留该行、`actual` 为 NULL，页面显示灰格，不计入分母，不做事后补判。
- `percent`（当日涨跌幅）不入库，由东方财富日 K 现取，进程内缓存 10 分钟；取不到时前端显示 `—`。
- `/api/log` 除 `items`、`next` 外还返回 `tradingDays`（最近 140 个交易日），供贡献图区分「没判断」和「非交易日」。
- 微信重复推送（重试）靠 UPSERT 幂等兜底，不设 MsgId 去重表。

## 测试