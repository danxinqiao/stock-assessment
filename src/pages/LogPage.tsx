import { useCallback, useEffect, useRef, useState } from 'react';
import ContributionGrid from '../components/ContributionGrid';
import Dash from '../components/Dash';
import type { LogItem } from '../lib/api';
import { api } from '../lib/api';
import {
  ACTUAL_LABEL,
  GUESS_LABEL,
  rateText,
  shortDate,
  signedPercent,
  weekdayOf,
} from '../lib/format';

function resultTone(item: LogItem): 'hit' | 'miss' | 'pending' {
  if (item.result === 'hit') return 'hit';
  if (item.result === 'miss') return 'miss';
  return 'pending';
}

function resultText(item: LogItem): string {
  if (item.result === 'hit') return '命中';
  if (item.result === 'miss') return '未中';
  return '待定';
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
  const rowRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const load = useCallback(async (before: string | null, limit = 50) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    try {
      const data = await api.log(before, limit);
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
    void load(null, 140);
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
    if (element) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      element.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    }
  };

  const hit = items.filter((item) => item.result === 'hit').length;
  const miss = items.filter((item) => item.result === 'miss').length;
  const selectedItem = selected
    ? items.find((item) => item.date === selected) ?? null
    : null;

  const currentMonth = items[0]?.date.slice(0, 7) ?? '';
  const monthItems = items.filter((item) => item.date.slice(0, 7) === currentMonth);
  const monthSettled = monthItems.filter((item) => item.result !== 'pending');
  const monthHit = monthSettled.filter((item) => item.result === 'hit').length;
  const monthMiss = monthSettled.length - monthHit;
  const monthAccuracy = monthSettled.length ? monthHit / monthSettled.length : null;
  const latestSettled = items.find((item) => item.result !== 'pending');

  const subtitle =
    loading && items.length === 0
      ? '正在读取判断明细…'
      : error && items.length === 0
        ? '判断明细暂不可用。'
        : monthSettled.length > 0
          ? `${Number(currentMonth.slice(5, 7))} 月 ${monthSettled.length} 次判断，命中 ${monthHit} 次${
              latestSettled
                ? `；最近一次 ${shortDate(latestSettled.date)} ${latestSettled.weekday}`
                : ''
            }。`
          : items.length > 0
            ? '本月还没有已判定的记录。'
            : '还没有判断记录。';

  const groups: { month: string; items: LogItem[] }[] = [];
  for (const item of items) {
    const month = item.date.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last && last.month === month) last.items.push(item);
    else groups.push({ month, items: [item] });
  }

  const firstLoading = loading && items.length === 0;

  return (
    <main>
      <div className="page-head">
        <div>
          <h1 className="page-title">判断明细</h1>
          <p className="page-sub">{subtitle}</p>
        </div>
      </div>

      {error && items.length === 0 ? (
        <div className="error-note" role="status">
          <span className="error-dot" aria-hidden="true" />
          <span>判断明细加载失败：{error}</span>
          <button className="text-btn" type="button" onClick={() => void load(null, 140)}>
            重试
          </button>
        </div>
      ) : null}

      <section className="panel tape">
        <div className="tape-main">
          <div className="panel-head">
            <h2 className="panel-title">判断记录</h2>
            <span className="panel-note">近 28 周</span>
          </div>
          <div className="tape-body">
            {firstLoading ? (
              <div className="skeleton" style={{ height: 186 }} />
            ) : (
              <ContributionGrid
                tradingDays={tradingDays}
                items={items}
                selected={selected}
                onSelect={handleSelect}
              />
            )}
          </div>
        </div>

        <aside className="tape-side">
          <div className="side-head">
            <h2 className="side-title">{selected ? '当日判断' : '本月概览'}</h2>
            <span className="side-note">
              {selected
                ? `${shortDate(selected)} ${selectedItem?.weekday ?? weekdayOf(selected)}`
                : currentMonth
                  ? `${Number(currentMonth.slice(5, 7))}月`
                  : '暂无'}
            </span>
          </div>

          <div className="side-body">
            {firstLoading ? (
              <div className="skeleton" style={{ height: 148 }} />
            ) : selected ? (
              selectedItem ? (
                <>
                  <div className="detail-call">
                    <span>{GUESS_LABEL[selectedItem.guess]}</span>
                    <span className="arrow">→</span>
                    <span className={selectedItem.actual ? undefined : 'pending'}>
                      {selectedItem.actual ? ACTUAL_LABEL[selectedItem.actual] : '待定'}
                    </span>
                  </div>
                  <div className="detail-meta">
                    <span className="detail-pct num">{signedPercent(selectedItem.percent)}</span>
                    <span className={`status-pill ${resultTone(selectedItem)}`}>
                      {resultText(selectedItem)}
                    </span>
                  </div>
                </>
              ) : (
                <p className="side-hint">当天没有判断记录。</p>
              )
            ) : (
              <>
                <div className="kv">
                  <span className="kv-label">判断</span>
                  <span className="kv-value">{monthSettled.length} 次</span>
                </div>
                <div className="kv">
                  <span className="kv-label">命中</span>
                  <span className="kv-value">{monthHit} 次</span>
                </div>
                <div className="kv">
                  <span className="kv-label">未中</span>
                  <span className="kv-value">{monthMiss} 次</span>
                </div>
                <div className="kv">
                  <span className="kv-label">准确率</span>
                  <span className="kv-value">
                    <strong>{monthAccuracy === null ? <Dash /> : rateText(monthAccuracy)}</strong>
                  </span>
                </div>
              </>
            )}

            <div className="legend" aria-label="图例">
              <span className="legend-item">
                <i className="swatch hit" aria-hidden="true" />
                命中
              </span>
              <span className="legend-item">
                <i className="swatch miss" aria-hidden="true" />
                未中
              </span>
              <span className="legend-item">
                <i className="swatch pending" aria-hidden="true" />
                未判断
              </span>
            </div>

            {selected ? (
              <button className="text-btn" type="button" onClick={() => setSelected(null)}>
                清除选择
              </button>
            ) : (
              <p className="side-hint">点选任意一天查看当日判断。</p>
            )}
          </div>
        </aside>
      </section>

      <section className="panel ledger-panel">
        <div className="panel-head">
          <h2 className="panel-title">逐日记录</h2>
          <span className="panel-note">
            已加载 {items.length} 条 · 命中 {hit} · 未中 {miss}
          </span>
        </div>

        {firstLoading ? (
          <div className="skeleton" style={{ height: 248, margin: '14px 22px 18px' }} />
        ) : items.length === 0 ? (
          <div className="grid-empty">还没有判断记录</div>
        ) : (
          <div className="ledger">
            <div className="ledger-head" aria-hidden="true">
              <span>日期</span>
              <span>判断 → 实际</span>
              <span>涨跌幅</span>
              <span>结果</span>
            </div>

            {groups.map((group) => (
              <div className="ledger-group" key={group.month}>
                <div className="ledger-month">
                  <h3>
                    {group.month.slice(0, 4)}年{Number(group.month.slice(5, 7))}月
                  </h3>
                  <span>{group.items.length} 条</span>
                </div>

                {group.items.map((item) => {
                  const tone = resultTone(item);
                  const active = selected === item.date;
                  return (
                    <button
                      key={item.date}
                      type="button"
                      ref={(element) => {
                        rowRefs.current[item.date] = element;
                      }}
                      className="ledger-row"
                      aria-pressed={active}
                      onClick={() => setSelected(item.date)}
                    >
                      <span className="ledger-date">
                        <span className="num">{shortDate(item.date)}</span>
                        <span className="ledger-weekday">{item.weekday}</span>
                      </span>

                      <span className="ledger-call">
                        <span>{GUESS_LABEL[item.guess]}</span>
                        <span className="arrow">→</span>
                        <span className={item.actual ? undefined : 'pending'}>
                          {item.actual ? ACTUAL_LABEL[item.actual] : '待定'}
                        </span>
                      </span>

                      <span className={item.percent === null ? 'ledger-pct is-empty' : 'ledger-pct'}>
                        {item.percent === null ? <Dash /> : signedPercent(item.percent)}
                      </span>

                      <span className={`ledger-result result-${tone}`}>
                        <i className={`result-dot ${tone}`} aria-hidden="true" />
                        {resultText(item)}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </section>

      <div ref={sentinelRef} className="sentinel" />

      {loading && items.length > 0 ? (
        <p className="load-note">加载中…</p>
      ) : error && items.length > 0 ? (
        <p className="load-note">
          <button className="text-btn" type="button" onClick={() => void load(nextRef.current)}>
            加载失败，重试
          </button>
        </p>
      ) : nextRef.current ? null : items.length > 0 ? (
        <p className="load-note">没有更多了</p>
      ) : null}
    </main>
  );
}
