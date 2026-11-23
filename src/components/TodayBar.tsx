import type { TodayResponse } from '../lib/api';
import { ACTUAL_LABEL, GUESS_LABEL, shortDate, signedPercent } from '../lib/format';
import Dash from './Dash';

interface Props {
  today: TodayResponse | null;
  failed?: boolean;
}

export default function TodayBar({ today, failed = false }: Props) {
  if (!today) {
    if (failed) {
      return (
        <div className="today">
          <div>
            <div className="today-date">今天</div>
            <div className="today-line">
              <span className="today-pending">今日状态暂不可用</span>
            </div>
          </div>
          <div className="today-side">
            <span className="status-pill neutral">暂无数据</span>
          </div>
        </div>
      );
    }

    return (
      <div className="today" aria-busy="true">
        <div>
          <div className="skeleton skeleton-line" style={{ width: 96, marginTop: 0 }} />
          <div className="skeleton skeleton-line" style={{ width: 176, height: 18 }} />
        </div>
        <div className="skeleton" style={{ width: 64, height: 22, borderRadius: 999 }} />
      </div>
    );
  }

  const { date, weekday, guess, actual, percent, result } = today;
  const guessLabel = guess ? GUESS_LABEL[guess] : null;
  const actualLabel = actual ? ACTUAL_LABEL[actual] : null;

  const pill =
    result === 'hit'
      ? { text: '命中', tone: 'hit' as const }
      : result === 'miss'
        ? { text: '未中', tone: 'miss' as const }
        : result === 'pending'
          ? { text: '待收盘', tone: 'neutral' as const }
          : { text: '待判断', tone: 'neutral' as const };

  return (
    <div className="today">
      <div>
        <div className="today-date">
          今天 · {shortDate(date)} {weekday}
        </div>
        <div className="today-line">
          {guessLabel ? (
            <span>{guessLabel}</span>
          ) : (
            <span className="today-pending">还没判断</span>
          )}

          {result === 'hit' || result === 'miss' ? (
            <>
              <span className="today-arrow">→</span>
              <span>{actualLabel ?? '已判定'}</span>
            </>
          ) : result === 'pending' ? (
            <>
              <span className="today-arrow">→</span>
              <span className="today-pending">待收盘</span>
            </>
          ) : null}
        </div>
      </div>

      <div className="today-side">
        <div className="today-metric">
          <span className="today-pct-label">当日涨跌幅</span>
          <span className={percent === null ? 'today-pct is-empty' : 'today-pct num'}>
            {percent === null ? <Dash label="暂无涨跌幅" /> : signedPercent(percent)}
          </span>
        </div>
        <span className={`status-pill ${pill.tone}`}>{pill.text}</span>
      </div>
    </div>
  );
}
