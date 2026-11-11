-- 大A 判断记录：建表
-- 应用方式：
--   wrangler d1 execute stock-journal --remote --file=./migrations/0001_init.sql

CREATE TABLE IF NOT EXISTS journal (
  trade_date TEXT PRIMARY KEY,
  guess      TEXT NOT NULL CHECK (guess IN ('up', 'down', 'flat')),
  actual     TEXT CHECK (actual IN ('up', 'down', 'flat'))
);

CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT
);
