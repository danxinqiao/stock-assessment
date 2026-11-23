import type { Direction, StatsResponse } from '../lib/api';
import { GUESS_LABEL, rateText } from '../lib/format';
import Dash from './Dash';

const DIRS: Direction[] = ['up', 'down', 'flat'];

export default function DirectionBreakdown({ stats }: { stats: StatsResponse | null }) {
  if (!stats) {
    return (
      <section className="panel" aria-busy="true">
        <div className="panel-head">
          <div className="skeleton skeleton-line" style={{ width: 72, marginTop: 0 }} />
        </div>
        <div className="panel-body">
          <div className="skeleton skeleton-panel" style={{ minHeight: 190 }} />
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2 className="panel-title">方向命中</h2>
        <span className="panel-note">按判断方向</span>
      </div>
      <div className="panel-body">
        <div className="dir-list">
          {DIRS.map((dir) => {
            const item = stats.byGuess[dir];
            return (
              <div className="dir-row" key={dir}>
                <div className="dir-top">
                  <span className="dir-name">{GUESS_LABEL[dir]}</span>
                  <span className={item.accuracy === null ? 'dir-value is-empty' : 'dir-value num'}>
                    {item.accuracy === null ? <Dash /> : rateText(item.accuracy)}
                  </span>
                </div>
                <div className="dir-meta">
                  {item.total} 次判断 · 命中 {item.hit}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
