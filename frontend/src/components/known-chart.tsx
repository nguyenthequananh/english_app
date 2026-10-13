import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { WeekCount } from '../types/api';

const H = 168;
const PAD = { top: 14, right: 8, bottom: 24 };

/** Bề ngang thật của khung (vẽ SVG đúng pixel để chữ trục không bị co giãn theo viewBox). */
function useWidth<T extends HTMLElement>(fallback: number, active: boolean) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  // Đo ngay trước khi vẽ (useLayoutEffect) để lần hiện đầu tiên đã đúng bề ngang, không nháy.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const initial = Math.round(el.getBoundingClientRect().width);
    if (initial > 0) setWidth(initial);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [active]);
  return [ref, width] as const;
}

/** Mốc trục tung tròn đẹp (1, 2, 5 × 10ⁿ) cho tối đa ~3 vạch. */
function niceMax(max: number) {
  if (max <= 4) return 4;
  const step = 10 ** Math.floor(Math.log10(max / 3));
  const n = [1, 2, 2.5, 5, 10].find((m) => (m * step * 3) >= max) ?? 10;
  return n * step * 3;
}

function shortDate(iso: string) {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

const fmt = new Intl.NumberFormat('vi-VN');

/** Đường số từ đã thuộc cộng dồn theo tuần — SVG tự vẽ, màu theo token. */
export function KnownChart({ points }: { points: WeekCount[] }) {
  const [ref, W] = useWidth<HTMLDivElement>(600, points.length >= 2);
  const gradientId = `known-fill-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  if (points.length < 2) {
    return (
      <p className="rounded-control bg-fill px-4 py-6 text-center text-[0.9375rem] leading-snug text-text-2">
        Cần ít nhất 2 tuần dữ liệu để vẽ biểu đồ.
      </p>
    );
  }

  const max = niceMax(Math.max(...points.map((p) => p.total), 1));
  const ticks = [0, max / 2, max];
  // Lề trái vừa nhãn trục tung dài nhất (≈6.6px mỗi ký tự ở cỡ 11px) để "15.000" không bị cắt.
  const left = Math.ceil(Math.max(...ticks.map((t) => fmt.format(Math.round(t)).length)) * 6.6) + 12;
  const innerW = Math.max(1, W - left - PAD.right);
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => left + (i * innerW) / (points.length - 1);
  const y = (v: number) => PAD.top + innerH - (v * innerH) / max;
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.total).toFixed(1)}`).join(' ');
  const area = `${line} L${x(points.length - 1).toFixed(1)},${PAD.top + innerH} L${left},${PAD.top + innerH} Z`;

  // Nhãn trục hoành thưa theo bề ngang (mỗi nhãn ~44px), luôn có điểm đầu và cuối.
  const every = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(innerW / 48))));
  const showLabel = (i: number) => i === points.length - 1 || (i % every === 0 && points.length - 1 - i >= every);

  const last = points[points.length - 1];

  return (
    <div ref={ref} className="w-full min-w-0 overflow-hidden">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Số từ đã thuộc theo tuần" className="block max-w-full overflow-visible">
        <title>{`Số từ đã thuộc theo tuần: ${fmt.format(last.total)} từ (tuần ${shortDate(last.weekStart)})`}</title>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--separator)" strokeWidth="1" strokeDasharray={t === 0 ? undefined : '3 4'} />
            <text x={left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize="11" fill="var(--text-3)" className="tabular-nums">
              {fmt.format(Math.round(t))}
            </text>
          </g>
        ))}
        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => showLabel(i) && (
          <text key={p.weekStart} x={x(i)} y={H - 6} fontSize="11" textAnchor={i === points.length - 1 ? 'end' : i === 0 ? 'start' : 'middle'} fill="var(--text-3)" className="tabular-nums">
            {shortDate(p.weekStart)}
          </text>
        ))}
        <circle cx={x(points.length - 1)} cy={y(last.total)} r="7" fill="var(--accent)" opacity="0.18" />
        <circle cx={x(points.length - 1)} cy={y(last.total)} r="4" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2.5" />
      </svg>
    </div>
  );
}
