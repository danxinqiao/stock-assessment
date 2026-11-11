import type { LogItem } from '../lib/api';
import { ACTUAL_LABEL, GUESS_LABEL, dayIndex, mondayOf, weekdayOf } from '../lib/format';

interface Props {
  tradingDays: string[];
  items: LogItem[];
  selected: string | null;
  onSelect: (date: string) => void;
}

const MAX_WEEKS = 20;

function cellColor(result: LogItem['result'] | undefined): string {
  if (result === 'hit') return 'bg-green-500 hover:bg-green-600';
  if (result === 'miss') return 'bg-red-500 hover:bg-red-600';
  return 'bg-slate-200 hover:bg-slate-300';
}

function cellTitle(date: string, item: LogItem | undefined): string {
  if (!item) return `${date} ${weekdayOf(date)} · 未判断`;
  const actual = item.actual ? ACTUAL_LABEL[item.actual] : '待定';
  const mark = item.result === 'hit' ? '✓' : item.result === 'miss' ? '✗' : '…';
  return `${date} ${item.weekday} ${GUESS_LABEL[item.guess]}→${actual} ${mark}`;
}

export default function ContributionGrid({ tradingDays, items, selected, onSelect }: Props) {
  const itemMap = new Map<string, LogItem>();
  for (const item of items) itemMap.set(item.date, item);

  const weekMap = new Map<string, (string | null)[]>();
  for (const date of tradingDays) {
    const key = mondayOf(date);
    let column = weekMap.get(key);
    if (!column) {
      column = new Array(7).fill(null);
      weekMap.set(key, column);
    }
    column[dayIndex(date)] = date;
  }

  const weeks = Array.from(weekMap.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(-MAX_WEEKS)
    .map(([key, days]) => {
      const firstDate = days.find((d): d is string => Boolean(d)) ?? key;
      return { key, days, month: Number(firstDate.slice(5, 7)) };
    });

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-700">判断记录</h2>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <i className="h-2.5 w-2.5 rounded-sm bg-green-500" />对
          </span>
          <span className="flex items-center gap-1">
            <i className="h-2.5 w-2.5 rounded-sm bg-red-500" />错
          </span>
          <span className="flex items-center gap-1">
            <i className="h-2.5 w-2.5 rounded-sm bg-slate-200" />未判断
          </span>
        </div>
      </div>

      {weeks.length === 0 ? (
        <div className="mt-4 py-8 text-center text-sm text-slate-400">还没有判断记录</div>
      ) : (
        <div className="mt-3 overflow-x-auto pb-1">
          <div className="flex min-w-max gap-[3px]">
            {weeks.map((week, index) => {
              const prevMonth = index > 0 ? weeks[index - 1].month : null;
              const showMonth = index === 0 || week.month !== prevMonth;
              return (
                <div key={week.key} className="flex flex-col gap-[3px]">
                  <div className="h-4 text-[10px] leading-4 text-slate-400">
                    {showMonth ? `${week.month}月` : ''}
                  </div>
                  {week.days.map((date, row) =>
                    date ? (
                      <button
                        key={date}
                        type="button"
                        title={cellTitle(date, itemMap.get(date))}
                        onClick={() => onSelect(date)}
                        className={
                          'h-3 w-3 rounded-sm transition ' +
                          cellColor(itemMap.get(date)?.result) +
                          (selected === date ? ' ring-2 ring-slate-900 ring-offset-1' : '')
                        }
                      />
                    ) : (
                      <div key={`empty-${row}`} className="h-3 w-3" />
                    ),
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
