import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import LogPage from './pages/LogPage';
import StatsPage from './pages/StatsPage';

function useRouter() {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const onChange = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onChange);
    return () => window.removeEventListener('popstate', onChange);
  }, []);

  const navigate = (to: string) => {
    if (to === window.location.pathname) return;
    window.history.pushState({}, '', to);
    setPath(to);
    window.scrollTo({ top: 0 });
  };

  return { path, navigate };
}

function followLink(event: MouseEvent<HTMLAnchorElement>, to: string, navigate: (to: string) => void) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
  event.preventDefault();
  navigate(to);
}

function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
      <g fill="currentColor">
        <rect x="4" y="10" width="4" height="9" rx="1" />
        <rect x="12" y="5" width="4" height="13" rx="1" />
        <rect x="20" y="13" width="4" height="8" rx="1" />
      </g>
      <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <path d="M6 6.5v3.5M6 19v3.5" />
        <path d="M14 2v3M14 18v3.5" />
        <path d="M22 9.5v3.5M22 21v3" />
      </g>
    </svg>
  );
}

function StatsIcon() {
  return (
    <svg className="nav-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M2 12.5 6 8l3 2.5L14 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogIcon() {
  return (
    <svg className="nav-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M3 4.5h10M3 8h10M3 11.5h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const TABS = [
  { path: '/', label: '统计', icon: <StatsIcon /> },
  { path: '/log', label: '明细', icon: <LogIcon /> },
];

export default function App() {
  const { path, navigate } = useRouter();
  const isLog = path.startsWith('/log');

  useEffect(() => {
    document.title = isLog ? '判断明细 · 大A 判断记录' : '判断统计 · 大A 判断记录';
  }, [isLog]);

  return (
    <div className="shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="/"
          onClick={(event) => followLink(event, '/', navigate)}
          aria-label="大A 判断记录，返回统计"
        >
          <BrandMark />
          <div>
            <div className="brand-name">大A 判断记录</div>
            <div className="brand-scope">上证 000001</div>
          </div>
        </a>

        <nav className="nav" aria-label="主导航">
          {TABS.map((tab) => {
            const active = tab.path === '/' ? !isLog : isLog;
            return (
              <a
                key={tab.path}
                className="nav-link"
                href={tab.path}
                aria-current={active ? 'page' : undefined}
                onClick={(event) => followLink(event, tab.path, navigate)}
              >
                {tab.icon}
                {tab.label}
              </a>
            );
          })}
        </nav>

        <div className="sidebar-foot">
          <div className="foot-line">每日 09:00 提醒</div>
          <div className="foot-line">15:15 收盘判定</div>
          <div className="foot-note">数据源 东方财富</div>
        </div>
      </aside>

      <div className="canvas">
        <div className="canvas-inner">{isLog ? <LogPage /> : <StatsPage />}</div>
      </div>
    </div>
  );
}
