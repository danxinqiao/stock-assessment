import type { Direction, StatsResponse } from '../lib/api';
import { ACTUAL_LABEL, GUESS_LABEL } from '../lib/format';

const DIRS: Direction[] = ['up', 'down', 'flat'];

export default function ConfusionMatrix({ stats }: { stats: StatsResponse | null }) {
  if (!stats) {
    return (
      <section className="panel" aria-busy="true">
        <div className="panel-head">
          <div className="skeleton skeleton-line" style={{ width: 88, marginTop: 0 }} />
        </div>
        <div className="panel-body">
          <div className="skeleton skeleton-panel" style={{ minHeight: 190 }} />
        </div>
      </section>
    );
  }

  const rowTotal = (guess: Direction) =>
    DIRS.reduce((sum, actual) => sum + stats.matrix[guess][actual], 0);
  const colTotal = (actual: Direction) =>
    DIRS.reduce((sum, guess) => sum + stats.matrix[guess][actual], 0);

  return (
    <section className="panel">
      <div className="panel-head">
        <h2 className="panel-title">混淆矩阵</h2>
        <span className="panel-note">预测 / 实际 · 共 {stats.total} 次</span>
      </div>
      <div className="panel-body">
        <table className="matrix">
          <thead>
            <tr>
              <th>预测 / 实际</th>
              {DIRS.map((dir) => (
                <th key={dir}>{ACTUAL_LABEL[dir]}</th>
              ))}
              <th>合计</th>
            </tr>
          </thead>
          <tbody>
            {DIRS.map((guess) => (
              <tr key={guess}>
                <th scope="row">{GUESS_LABEL[guess]}</th>
                {DIRS.map((actual) => {
                  const value = stats.matrix[guess][actual];
                  const diagonal = guess === actual;
                  const tone = diagonal ? 'diag' : value > 0 ? 'err' : 'zero';
                  return (
                    <td key={actual}>
                      <span className={`matrix-cell ${tone}`}>{value}</span>
                    </td>
                  );
                })}
                <td className="total">{rowTotal(guess)}</td>
              </tr>
            ))}
            <tr className="matrix-foot">
              <th scope="row">合计</th>
              {DIRS.map((actual) => (
                <td key={actual} className="total">
                  {colTotal(actual)}
                </td>
              ))}
              <td className="total">{stats.total}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
