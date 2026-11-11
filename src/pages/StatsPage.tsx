import { useEffect, useState } from 'react';
import ConfusionMatrix from '../components/ConfusionMatrix';
import RangeTabs from '../components/RangeTabs';
import StatCards from '../components/StatCards';
import TodayBar from '../components/TodayBar';
import WeeklyChart from '../components/WeeklyChart';
import type { StatsResponse, TodayResponse } from '../lib/api';
import { api } from '../lib/api';

export default function StatsPage() {
  const [range, setRange] = useState('30d');
  const [today, setToday] = useState<TodayResponse | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .today()
      .then(setToday)
      .catch(() => setToday(null));
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

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
  }, [range]);

  return (
    <main className="mt-4 space-y-3">
      <TodayBar today={today} />
      <RangeTabs value={range} onChange={setRange} />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          统计数据加载失败：{error}
        </div>
      ) : null}

      <StatCards stats={stats} />
      <ConfusionMatrix stats={stats} />
      <WeeklyChart stats={stats} />

      {!loading && stats && stats.total === 0 ? (
        <p className="pb-4 text-center text-xs text-slate-400">这个区间还没有已判定的记录</p>
      ) : null}
    </main>
  );
}
