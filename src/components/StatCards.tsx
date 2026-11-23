import type { StatsResponse } from '../lib/api';
import { rateText } from '../lib/format';
import Dash from './Dash';

export default function StatCards({ stats }: { stats: StatsResponse | null }) {
  if (!stats) {
    return (
      <section className="kpi" aria-label="关键指标" aria-busy="true">
        <div className="kpi-cell">
          <div className="skeleton skeleton-line short" style={{ marginTop: 0 }} />
          <div className="skeleton skeleton-value" />
          <div className="skeleton skeleton-line short" />
        </div>
        <div className="kpi-cell">
          <div className="skeleton skeleton-line short" style={{ marginTop: 0 }} />
          <div className="skeleton skeleton-value small" />
          <div className="skeleton skeleton-line short" />
        </div>
        <div className="kpi-cell">
          <div className="skeleton skeleton-line short" style={{ marginTop: 0 }} />
          <div className="skeleton skeleton-value small" />
          <div className="skeleton skeleton-line short" />
        </div>
      </section>
    );
  }

  return (
    <section className="kpi" aria-label="关键指标">
      <div className="kpi-cell">
        <div className="kpi-label">准确率</div>
        <div className={stats.accuracy === null ? 'kpi-value is-empty' : 'kpi-value lead num'}>
          {stats.accuracy === null ? <Dash label="暂无准确率" /> : rateText(stats.accuracy)}
        </div>
        <div className="kpi-meta">
          命中 {stats.hit} / {stats.total}
        </div>
      </div>

      <div className="kpi-cell">
        <div className="kpi-label">二元方向</div>
        <div
          className={
            stats.binary.accuracy === null ? 'kpi-value is-empty' : 'kpi-value num'
          }
        >
          {stats.binary.accuracy === null ? (
            <Dash label="暂无二元方向准确率" />
          ) : (
            rateText(stats.binary.accuracy)
          )}
        </div>
        <div className="kpi-meta">
          命中 {stats.binary.hit} / {stats.binary.total}
        </div>
      </div>

      <div className="kpi-cell">
        <div className="kpi-label">当前连胜</div>
        <div className="kpi-value num">
          {stats.streak}
          <span className="kpi-unit">次</span>
        </div>
        <div className="kpi-meta">连续命中</div>
      </div>
    </section>
  );
}
