import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { StatsResponse } from '../lib/api';

export default function WeeklyChart({ stats }: { stats: StatsResponse | null }) {
  if (!stats) {
    return <div className="h-56 animate-pulse rounded-xl bg-slate-100" />;
  }

  const data = stats.weekly.map((item) => ({
    week: item.week.slice(-2),
    fullWeek: item.week,
    accuracy: item.accuracy === null ? null : Number((item.accuracy * 100).toFixed(1)),
    total: item.total,
  }));

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-medium text-slate-700">准确率走势（按周）</h2>
      {data.length < 2 ? (
        <div className="mt-6 flex h-40 items-center justify-center text-sm text-slate-400">
          数据还不够，至少需要两周
        </div>
      ) : (
        <div className="mt-3 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value: number | string) => [`${value}%`, '准确率']}
                labelFormatter={(label) => `第 ${label} 周`}
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#0f172a"
                strokeWidth={2}
                dot={{ r: 2.5, fill: '#0f172a' }}
                activeDot={{ r: 4 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
