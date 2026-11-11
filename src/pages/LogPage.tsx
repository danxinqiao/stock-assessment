import { useCallback, useEffect, useRef, useState } from 'react';
import ContributionGrid from '../components/ContributionGrid';
import type { LogItem } from '../lib/api';
import { api } from '../lib/api';
import { ACTUAL_LABEL, GUESS_LABEL, shortDate, signedPercent } from '../lib/format';

function resultMark(item: LogItem): { text: string; className: string } {
  if (item.result === 'hit') return { text: '✓', className: 'text-green-600' };
  if (item.result === 'miss') return { text: '✗', className: 'text-red-600' };
  return { text: '…', className: 'text-slate-400' };
}

export default function LogPage() {
  const [items, setItems] = useState<LogItem[]>([]);
  const [tradingDays, setTradingDays] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const nextRef = useRef<string | null>(null);
  const loadingRef = useRef(false);
  const startedRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<Record<string, HTMLLIElement | null>>({});

  const load = useCallback(async (before: string | null) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    try {
      const data = await api.log(before);
      setItems((prev) => {
        const seen = new Set(prev.map((item) => item.date));
        return [...prev, ...data.items.filter((item) => !seen.has(item.date))];
      });
      nextRef.current = data.next;
      if (data.tradingDays.length > 0) setTradingDays(data.tradingDays);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void load(null);
  }, [load]);

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting && nextRef.current && !loadingRef.current) {
          void load(nextRef.current);
        }
      },
      { rootMargin: '240px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [load]);

  const handleSelect = (date: string) => {
    setSelected(date);
    const element = rowRefs.current[date];
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const hit = items.filter((item) => item.result === 'hit').length;
  const miss = items.filter((item) => item.result === 'miss').length;
  const selectedItem = selected ? items.find((item) => item.date === selected) ?? null : null;

  const groups: { month: string; items: LogItem[] }[] = [];
  for (const item of items) {
    const month = item.date.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last && last.month === month) last.items.push(item);
    else groups.push({ month, items: [item] });
  }

  return (
    <main className="mt-4 space-y-3">
      <ContributionGrid
        tradingDays={tradingDays}
        items={items}
        selected={selected}
        onSelect={handleSelect}
      />

      {selected ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
          {selectedItem ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="text-slate-500">
                {selectedItem.date} {selectedItem.weekday}
              </span>
              <span>
                {GUESS_LABEL[selectedItem.guess]} →{' '}
                {selectedItem.actual ? ACTUAL_LABEL[selectedItem.actual] : '待定'}
              </span>
              <span className="tabular-nums text-slate-400">
                {signedPercent(selectedItem.percent)}
              </span>
              <span className={resultMark(selectedItem).className}>
                {resultMark(selectedItem).text}
              </span>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="ml-auto text-xs text-slate-400 hover:text-slate-600"
              >
                关闭
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{selected} · 当天没有判断记录</span>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                关闭
              </button>
            </div>
          )}
        </div>
      ) : null}

      <div className="flex items-baseline justify-between px-1">
        <span className="text-xs text-slate-500">
          已加载 {items.length} 条 · 对 {hit} · 错 {miss}
        </span>
        {error ? <span className="text-xs text-red-500">加载失败：{error}</span> : null}
      </div>

      {items.length === 0 && !loading ? (
        <div className="rounded-xl border border-slate-200 bg-white py-12 text-center text-sm text-slate-400">
          还没有判断记录
        </div>
      ) : null}

      <div className="space-y-4">
        {groups.map((group) => (
          <section key={group.month}>
            <h3 className="mb-1 px-1 text-xs text-slate-400">
              {Number(group.month.slice(5, 7))}月
            </h3>
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {group.items.map((item) => {
                const mark = resultMark(item);
                const active = selected === item.date;
                return (
                  <li
                    key={item.date}
                    ref={(element) => {
                      rowRefs.current[item.date] = element;
                    }}
                    onClick={() => setSelected(item.date)}
                    className={
                      'flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition ' +
                      (active ? 'bg-slate-50' : 'hover:bg-slate-50')
                    }
                  >
                    <span className="w-24 shrink-0 text-slate-500">
                      {shortDate(item.date)} {item.weekday}
                    </span>
                    <span className="flex-1 text-slate-700">
                      {GUESS_LABEL[item.guess]} →{' '}
                      {item.actual ? ACTUAL_LABEL[item.actual] : '待定'}
                    </span>
                    <span className="w-16 text-right tabular-nums text-slate-400">
                      {signedPercent(item.percent)}
                    </span>
                    <span className={'w-4 text-right ' + mark.className}>{mark.text}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div ref={sentinelRef} className="h-8" />

      {loading ? (
        <p className="pb-6 text-center text-xs text-slate-400">加载中…</p>
      ) : nextRef.current ? null : items.length > 0 ? (
        <p className="pb-6 text-center text-xs text-slate-300">没有更多了</p>
      ) : null}
    </main>
  );
}
