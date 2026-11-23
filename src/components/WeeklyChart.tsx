import { useLayoutEffect, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { StatsResponse } from '../lib/api';

const TICKS = [0, 25, 50, 75, 100];

function pct(value: number | null): string {
  return value === null ? '—' : `${(value * 100).toFixed(1)}%`;
}

function weekLabel(week: string): string {
  return week.slice(5);
}

export default function WeeklyChart({ stats }: { stats: StatsResponse | null }) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!host) return;

    const measure = () => setWidth(host.clientWidth);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, [host]);

  if (!stats) {
    return (
      <section className="panel chart-panel" aria-busy="true">
        <div className="panel-head">
          <div className="skeleton skeleton-line" style={{ width: 96, marginTop: 0 }} />
        </div>
        <div className="skeleton skeleton-chart" />
      </section>
    );
  }

  const weeks = stats.weekly.filter((item) => item.accuracy !== null);
  const note = weeks.length ? `按周 · 最近 ${weeks.length} 周` : '按周';

  if (weeks.length < 2) {
    return (
      <section className="panel chart-panel">
        <div className="panel-head">
          <h2 className="panel-title">准确率走势</h2>
          <span className="panel-note">{note}</span>
        </div>
        <div className="panel-body">
          <div className="chart-empty">至少需要两周数据才能画出走势。</div>
        </div>
      </section>
    );
  }

  const height = width < 520 ? 200 : 240;
  const margin = { top: 16, right: 14, bottom: 26, left: 34 };
  const plotW = Math.max(20, width - margin.left - margin.right);
  const plotH = Math.max(20, height - margin.top - margin.bottom);
  const n = weeks.length;

  const x = (index: number) => margin.left + (index / (n - 1)) * plotW;
  const y = (value: number) => margin.top + (1 - value / 100) * plotH;

  const line = weeks
    .map((item, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)} ${y(item.accuracy! * 100).toFixed(1)}`)
    .join(' ');
  const area = `${line} L${x(n - 1).toFixed(1)} ${y(0).toFixed(1)} L${x(0).toFixed(1)} ${y(0).toFixed(1)} Z`;

  const maxLabels = width < 520 ? 4 : 6;
  const step = Math.max(1, Math.ceil((n - 1) / (maxLabels - 1)));
  const labelIndexes: number[] = [];
  for (let index = 0; index < n; index += step) labelIndexes.push(index);
  if (labelIndexes[labelIndexes.length - 1] !== n - 1) {
    if (n - 1 - labelIndexes[labelIndexes.length - 1] < step * 0.6) labelIndexes.pop();
    labelIndexes.push(n - 1);
  }

  const latest = weeks[n - 1];
  const best = weeks.reduce((a, b) => ((b.accuracy ?? 0) > (a.accuracy ?? 0) ? b : a));
  const worst = weeks.reduce((a, b) => ((b.accuracy ?? 1) < (a.accuracy ?? 1) ? b : a));

  const move = (event: ReactPointerEvent<SVGRectElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const ratio = (event.clientX - rect.left) / rect.width;
    const index = Math.round(ratio * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, index)));
  };

  const active = hover === null ? null : weeks[hover];
  const activeValue = active?.accuracy ?? null;
  const tipLeft = hover === null ? 0 : Math.max(78, Math.min(width - 78, x(hover)));
  const tipTop =
    activeValue === null ? 4 : Math.max(4, y(activeValue * 100) - 72);

  return (
    <section className="panel chart-panel">
      <div className="panel-head">
        <h2 className="panel-title">准确率走势</h2>
        <span className="panel-note">{note}</span>
      </div>
      <div className="panel-body">
        <div
          className="chart-host"
          ref={setHost}
          style={{ height }}
          role="img"
          aria-label={`准确率走势，最近 ${n} 周。最新 ${pct(latest.accuracy)}，最高 ${pct(
            best.accuracy,
          )}，最低 ${pct(worst.accuracy)}。`}
        >
          {width > 0 ? (
            <svg className="chart-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
              {TICKS.map((tick) => {
                if (tick === 50) return null;
                return (
                  <line
                    key={`grid-${tick}`}
                    x1={margin.left}
                    x2={margin.left + plotW}
                    y1={y(tick)}
                    y2={y(tick)}
                    stroke={tick === 0 ? '#d8dad1' : '#e9eae3'}
                    strokeWidth="1"
                  />
                );
              })}

              {TICKS.map((tick) => (
                <text
                  key={`tick-${tick}`}
                  className="chart-text"
                  x={margin.left - 8}
                  y={y(tick) + 4}
                  textAnchor="end"
                >
                  {tick === 100 ? '100%' : tick}
                </text>
              ))}

              <line
                x1={margin.left}
                x2={margin.left + plotW}
                y1={y(50)}
                y2={y(50)}
                stroke="#c3c7bc"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text
                className="chart-ref-label"
                x={margin.left + plotW}
                y={y(50) - 6}
                textAnchor="end"
              >
                随机 50%
              </text>

              <path d={area} fill="var(--accent)" fillOpacity="0.07" />
              <path
                d={line}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {labelIndexes.map((index) => {
                const anchor =
                  index === 0 ? 'start' : index === n - 1 ? 'end' : 'middle';
                return (
                  <text
                    key={`x-${index}`}
                    className="chart-text"
                    x={x(index)}
                    y={height - 7}
                    textAnchor={anchor}
                  >
                    {weekLabel(weeks[index].week)}
                  </text>
                );
              })}

              {hover !== null && active && activeValue !== null ? (
                <>
                  <line
                    x1={x(hover)}
                    x2={x(hover)}
                    y1={margin.top}
                    y2={margin.top + plotH}
                    stroke="#c9ccc3"
                    strokeWidth="1"
                  />
                  <circle
                    cx={x(hover)}
                    cy={y(activeValue * 100)}
                    r="4"
                    fill="var(--accent)"
                    stroke="var(--surface)"
                    strokeWidth="2"
                  />
                </>
              ) : null}

              <rect
                x={margin.left}
                y={margin.top}
                width={plotW}
                height={plotH}
                fill="transparent"
                onPointerMove={move}
                onPointerDown={move}
                onPointerLeave={() => setHover(null)}
                onPointerCancel={() => setHover(null)}
              />
            </svg>
          ) : null}

          {hover !== null && active && activeValue !== null ? (
            <div className="chart-tooltip" style={{ left: tipLeft, top: tipTop }}>
              <div className="chart-tooltip-week">{weekLabel(active.week)} 当周</div>
              <div className="chart-tooltip-value num">{pct(activeValue)}</div>
              <div className="chart-tooltip-meta">
                命中 {active.hit} / {active.total}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
