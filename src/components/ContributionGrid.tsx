import type { LogItem } from '../lib/api';
import { ACTUAL_LABEL, GUESS_LABEL, dayIndex, mondayOf, weekdayOf } from '../lib/format';

interface Props {
  tradingDays: string[];
  items: LogItem[];
  selected: string | null;
  onSelect: (date: string) => void;
}

const MAX_WEEKS = 28;
const WEEKDAY_LABELS = ['一', '', '三', '', '五', '', ''];

function cellTone(result: LogItem['result'] | undefined): 'hit' | 'miss' | 'pending' {
  if (result === 'hit') return 'hit';
  if (result === 'miss') return 'miss';
  return 'pending';
}

function cellLabel(date: string, item: LogItem | undefined): string {
  if (!item) return `${date} ${weekdayOf(date)} · 未判断`;
  const actual = item.actual ? ACTUAL_LABEL[item.actual] : '待定';
  const mark = item.result === 'hit' ? '命中' : item.result === 'miss' ? '未中' : '待定';
  return `${date} ${item.weekday} ${GUESS_LABEL[item.guess]} → ${actual} · ${mark}`;
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
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, MAX_WEEKS)
    .map(([key, days]) => {
      const firstDate = days.find((day): day is string => Boolean(day)) ?? key;
      return { key, days, month: Number(firstDate.slice(5, 7)) };
    });

  if (weeks.length === 0) {
    return <div className="grid-empty">还没有判断记录</div>;
  }

  return (
    <div className="grid-scroll">
      <div className="grid-inner">
        <div className="grid-weekdays" aria-hidden="true">
          {WEEKDAY_LABELS.map((label, index) => (
            <div className="grid-weekday" key={`weekday-${index}`}>
              {label}
            </div>
          ))}
        </div>

        <div className="grid-weeks">
          {weeks.map((week, weekIndex) => {
            const previousMonth = weekIndex > 0 ? weeks[weekIndex - 1].month : null;
            const showMonth = weekIndex === 0 || week.month !== previousMonth;

            return (
              <div className="grid-week" key={week.key}>
                <div className="grid-month">{showMonth ? `${week.month}月` : ''}</div>
                {week.days.map((date, row) => {
                  if (!date) {
                    return <span className="grid-cell blank" key={`blank-${week.key}-${row}`} />;
                  }

                  const item = itemMap.get(date);
                  const label = cellLabel(date, item);
                  return (
                    <button
                      key={date}
                      type="button"
                      title={label}
                      aria-label={label}
                      aria-pressed={selected === date}
                      onClick={() => onSelect(date)}
                      className={
                        'grid-cell ' +
                        cellTone(item?.result) +
                        (selected === date ? ' selected' : '')
                      }
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
