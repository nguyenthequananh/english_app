import type { ReactNode } from 'react';
import { cn } from './cn';

/** Vòng tiến độ, cùng ngữ nghĩa ARIA với ProgressBar (`value` 0..1 → aria-valuenow 0..100). Nội dung con nằm giữa vòng. */
export function ProgressRing({ value, label, size = 64, children, className }: {
  value: number;
  label: string;
  size?: number;
  children?: ReactNode;
  className?: string;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0)) * 100);
  const stroke = Math.max(4, Math.round(size / 11));
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--fill)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct / 100)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      {children !== undefined && <div className="relative flex flex-col items-center justify-center text-center">{children}</div>}
    </div>
  );
}
