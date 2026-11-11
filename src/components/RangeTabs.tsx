const RANGES = [
  { key: '7d', label: '近7天' },
  { key: '30d', label: '近30天' },
  { key: '90d', label: '近90天' },
  { key: 'ytd', label: '今年' },
  { key: 'all', label: '全部' },
];

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function RangeTabs({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
      {RANGES.map((item) => {
        const active = item.key === value;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={
              'flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition ' +
              (active
                ? 'bg-white font-medium text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700')
            }
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
