import type { Skill } from '../types/skill';
import { toneClass } from './skill';
import { cn } from './cn';

function percent(value: number) {
  return Math.round(Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0)) * 100);
}

/**
 * Thanh tiến độ. `value` từ 0 đến 1; ARIA báo theo phần trăm (aria-valuenow 0..100).
 * Phần tô chạy bằng transform (không đổi layout) nên đổi giá trị mượt mà rẻ.
 */
export function ProgressBar({ value, label, color = 'accent', showValue = false, className }: {
  value: number;
  /** Tên accessible của thanh. */
  label: string;
  color?: Skill | 'accent';
  showValue?: boolean;
  className?: string;
}) {
  const pct = percent(value);
  return (
    <div className={cn('flex items-center gap-3', toneClass(color), className)}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="relative h-2 flex-1 overflow-hidden rounded-full bg-fill"
      >
        <div
          className="absolute inset-0 rounded-full bg-[var(--tone)] transition-transform duration-500 ease-out"
          style={{ transform: `translateX(${pct - 100}%)` }}
        />
      </div>
      {showValue && (
        <span aria-hidden="true" className="w-10 shrink-0 text-right text-[0.8125rem] font-semibold tabular-nums text-text-2">{pct}%</span>
      )}
    </div>
  );
}
