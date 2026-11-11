import type { TodayResponse } from '../lib/api';
import { ACTUAL_LABEL, GUESS_LABEL, shortDate, signedPercent } from '../lib/format';

export default function TodayBar({ today }: { today: TodayResponse | null }) {
  if (!today) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-400">
        加载中…
      </div>
    );
  }

  const { date, weekday, guess, actual, percent, result, reminded } = today;
  let body = '';
  let tone = 'text-slate-600';

  if (result === 'none') {
    body = reminded ? '已提醒 · 还没判断' : '还没判断';
  } else if (result === 'pending') {
    body = guess ? `已判断「${GUESS_LABEL[guess]}」· 待收盘` : '还没判断';
  } else if (result === 'hit') {
    body = guess && actual ? `已判断「${GUESS_LABEL[guess]}」· 实际${ACTUAL_LABEL[actual]} ✓` : '已判定';
    tone = 'text-green-600';
  } else {
    body = guess && actual ? `已判断「${GUESS_LABEL[guess]}」· 实际${ACTUAL_LABEL[actual]} ✗` : '已判定';
    tone = 'text-red-600';
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-slate-500">
          今天 {shortDate(date)} {weekday}
        </span>
        {percent !== null && (
          <span className="text-xs tabular-nums text-slate-400">{signedPercent(percent)}</span>
        )}
      </div>
      <div className={`mt-1 text-base font-medium ${tone}`}>{body}</div>
    </div>
  );
}
