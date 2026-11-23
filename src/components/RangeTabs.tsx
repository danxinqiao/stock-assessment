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
    <div className="seg" role="tablist" aria-label="统计区间">
      {RANGES.map((item) => {
        const active = item.key === value;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.key)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
