import type { Direction, StatsResponse } from '../lib/api';
import { ACTUAL_LABEL, GUESS_LABEL } from '../lib/format';

const DIRS: Direction[] = ['up', 'down', 'flat'];

export default function ConfusionMatrix({ stats }: { stats: StatsResponse | null }) {
  if (!stats) {
    return <div className="h-40 animate-pulse rounded-xl bg-slate-100" />;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-medium text-slate-700">混淆矩阵</h2>
      <table className="mt-3 w-full text-center text-sm">
        <thead>
          <tr className="text-xs text-slate-400">
            <th className="py-1 text-left font-normal">预测 \ 实际</th>
            {DIRS.map((dir) => (
              <th key={dir} className="py-1 font-normal">
                {ACTUAL_LABEL[dir]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DIRS.map((guess) => (
            <tr key={guess} className="border-t border-slate-100">
              <td className="py-2 text-left text-xs text-slate-500">{GUESS_LABEL[guess]}</td>
              {DIRS.map((actual) => {
                const value = stats.matrix[guess][actual];
                const onDiagonal = guess === actual;
                return (
                  <td key={actual} className="py-2">
                    <span
                      className={
                        'inline-flex h-8 w-10 items-center justify-center rounded-md tabular-nums ' +
                        (onDiagonal
                          ? 'bg-green-50 font-medium text-green-700'
                          : value > 0
                            ? 'text-red-600'
                            : 'text-slate-300')
                      }
                    >
                      {value}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
