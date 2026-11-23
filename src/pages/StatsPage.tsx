import { useEffect, useState } from 'react';
import ConfusionMatrix from '../components/ConfusionMatrix';
import DirectionBreakdown from '../components/DirectionBreakdown';
import RangeTabs from '../components/RangeTabs';
import StatCards from '../components/StatCards';
import TodayBar from '../components/TodayBar';
import WeeklyChart from '../components/WeeklyChart';
import type { StatsResponse, TodayResponse } from '../lib/api';
import { api } from '../lib/api';

const RANGE_LABEL: Record<string, string> = {
  '7d': '近 7 天',
  '30d': '近 30 天',
  '90d': '近 90 天',
  ytd: '今年',
  all: '全部',
};

function summary(stats: StatsResponse | null, range: string, loading: boolean, error: string | null) {
  const label = RANGE_LABEL[range] ?? '当前区间';

  if (loading) return `正在读取${label}的判断记录…`;
  if (error && !stats) return '统计数据暂不可用。';
  if (!stats) return '正在读取判断记录…';
  if (stats.total === 0) return `${label}还没有已判定的记录。`;

  return `${label} ${stats.total} 次判断，命中 ${stats.hit} 次；当前连续命中 ${stats.streak} 次。`;
}

export default function StatsPage() {
  const [range, setRange] = useState('30d');
  const [today, setToday] = useState<TodayResponse | null>(null);
  const [todayFailed, setTodayFailed] = useState(false);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let alive = true;

    api
      .today()
      .then((data) => {
        if (!alive) return;
        setToday(data);
        setTodayFailed(false);
      })
      .catch(() => {
        if (!alive) return;
        setToday(null);
        setTodayFailed(true);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    setStats(null);

    api
      .stats(range)
      .then((data) => {
        if (!alive) return;
        setStats(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [range, retry]);

  return (
    <main>
      <div className="page-head">
        <div>
          <h1 className="page-title">判断统计</h1>
          <p className="page-sub">{summary(stats, range, loading, error)}</p>
        </div>
        <div className="page-head-side">
          <RangeTabs value={range} onChange={setRange} />
        </div>
      </div>

      {error ? (
        <div className="error-note" role="status">
          <span className="error-dot" aria-hidden="true" />
          <span>统计数据加载失败：{error}</span>
          <button className="text-btn" type="button" onClick={() => setRetry((value) => value + 1)}>
            重试
          </button>
        </div>
      ) : null}

      <TodayBar today={today} failed={todayFailed} />
      <StatCards stats={stats} />
      <WeeklyChart stats={stats} />

      <div className="stats-row">
        <ConfusionMatrix stats={stats} />
        <DirectionBreakdown stats={stats} />
      </div>
    </main>
  );
}
