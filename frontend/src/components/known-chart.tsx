import type { WeekCount } from '../types/api';

const W = 600;
const H = 160;
const PAD = 24;

export function KnownChart({ points }: { points: WeekCount[] }) {
  if (points.length < 2) {
    return <p className="text-sm text-slate-500">Cần ít nhất 2 tuần dữ liệu để vẽ biểu đồ.</p>;
  }
  const max = Math.max(...points.map((p) => p.total), 1);
  const x = (i: number) => PAD + (i * (W - 2 * PAD)) / (points.length - 1);
  const y = (v: number) => H - PAD - (v * (H - 2 * PAD)) / max;
  const line = points.map((p, i) => `${x(i)},${y(p.total)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Số từ đã thuộc theo tuần">
      <polyline points={line} fill="none" stroke="#4f46e5" strokeWidth="3" />
      {points.map((p, i) => (
        <g key={p.weekStart}>
          <circle cx={x(i)} cy={y(p.total)} r="4" fill="#4f46e5" />
          <text x={x(i)} y={H - 6} fontSize="10" textAnchor="middle" fill="#64748b">{p.weekStart.slice(5)}</text>
        </g>
      ))}
      <text x={x(points.length - 1)} y={y(points[points.length - 1].total) - 8} fontSize="12" textAnchor="end" fill="#1e293b">
        {points[points.length - 1].total}
      </text>
    </svg>
  );
}
