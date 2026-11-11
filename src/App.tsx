import { useEffect, useState } from 'react';
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

const TABS = [
  { path: '/', label: '统计' },
  { path: '/log', label: '明细' },
];

export default function App() {
  const { path, navigate } = useRouter();
  const isLog = path.startsWith('/log');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 pb-10 pt-6">
        <header className="flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-semibold tracking-tight">大A 判断记录</h1>

          <nav className="flex rounded-lg bg-slate-100 p-1">
            {TABS.map((tab) => {
              const active = tab.path === '/' ? !isLog : isLog;
              return (
                <button
                  key={tab.path}
                  type="button"
                  onClick={() => navigate(tab.path)}
                  className={
                    'rounded-md px-3 py-1 text-sm transition ' +
                    (active
                      ? 'bg-white font-medium text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700')
                  }
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <span className="ml-auto text-xs text-slate-400">上证 000001</span>
        </header>

        {isLog ? <LogPage /> : <StatsPage />}
      </div>
    </div>
  );
}
