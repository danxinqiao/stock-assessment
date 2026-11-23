interface Props {
  label?: string;
}

export default function Dash({ label = '暂无数据' }: Props) {
  return <span className="dash" role="img" aria-label={label} />;
}
