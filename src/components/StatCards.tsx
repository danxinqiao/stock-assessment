import type { StatsResponse } from '../lib/api';
import { rateText } from '../lib/format';

export default function StatCards({ stats }: { stats: StatsResponse | null }) {
  if (!stats) {
    return <div className="h-28 animate-pulse rounded-xl bg-slate-100" />;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="text-xs text-slate-500">准确率</div>
        <div className="mt-1 text-4xl font-semibold tabular-nums text-slate-900">
          {rateText(stats.accuracy)}
        </div>
        <div className="mt-1 text-xs text-slate-400">
          命中 {stats.hit} / {stats.total}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">二元方向</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
            {rateText(stats.binary.accuracy)}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {stats.binary.hit} / {stats.binary.total}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">当前连胜</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
            {stats.streak}
          </div>
          <div className="mt-1 text-xs text-slate-400">连续命中</div>
        </div>
      </div>
    </div>
  );
}
