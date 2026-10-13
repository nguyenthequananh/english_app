import { useEffect, useState } from 'react';
import type { SessionStep } from '../types/api';
import { Icon } from '../ui/icons';
import { cn } from '../ui/cn';

const STEPS: { step: SessionStep; label: string }[] = [
  { step: 'REVIEW', label: 'Ôn tập' },
  { step: 'NEW', label: 'Từ mới' },
  { step: 'LESSON', label: 'Bài chính' },
];
const ORDER: SessionStep[] = ['REVIEW', 'NEW', 'LESSON', 'DONE'];

/**
 * Phần đã xong của bước thẻ hiện tại (0..1). Không có tổng từ API nên lấy số thẻ còn lại lớn nhất từng thấy
 * trong bước làm mẫu số; chấm "Quên" đẩy thẻ về cuối hàng nên số còn lại không giảm — thanh đứng yên là đúng.
 */
function useStepFraction(step: SessionStep, left: number | undefined) {
  const [peak, setPeak] = useState({ step, max: left ?? 0 });
  // Cập nhật state ngay trong render khi props đổi (mẫu "điều chỉnh state theo props" của React).
  if (peak.step !== step) setPeak({ step, max: left ?? 0 });
  else if (left !== undefined && left > peak.max) setPeak({ step, max: left });
  const max = peak.step === step ? Math.max(peak.max, left ?? 0) : left ?? 0;
  if (left === undefined || max === 0) return 0;
  return 1 - left / max;
}

/** Thanh 3 bước gọn dưới TopBar: mỗi bước một đoạn tiến độ + nhãn; bước đang làm có số thẻ còn lại. */
export function StepBar({ step, reviewsLeft, newLeft }: { step: SessionStep; reviewsLeft: number; newLeft: number }) {
  const order = ORDER.indexOf(step);
  const counts: Partial<Record<SessionStep, number>> = { REVIEW: reviewsLeft, NEW: newLeft };
  const fraction = useStepFraction(step, counts[step]);
  return (
    <div data-testid="session-step" data-step={step}>
      <ol aria-label="Các bước buổi học" className="grid grid-cols-3 gap-2">
        {STEPS.map((s, i) => {
          const done = i < order;
          const current = i === order;
          const fill = done ? 1 : current ? fraction : 0;
          return (
            <li key={s.step} aria-current={current ? 'step' : undefined} className="min-w-0">
              <div
                className={cn(
                  'relative h-1.5 overflow-hidden rounded-full',
                  current ? 'bg-[color-mix(in_srgb,var(--accent)_26%,transparent)]' : 'bg-fill',
                )}
              >
                <div
                  className="absolute inset-0 rounded-full bg-accent transition-transform duration-(--duration-progress) ease-out"
                  style={{ transform: `translateX(${(fill - 1) * 100}%)` }}
                />
              </div>
              <p
                className={cn(
                  'mt-2 flex min-w-0 items-center gap-1 text-[0.8125rem] leading-tight',
                  current ? 'font-semibold text-text' : 'text-text-3',
                )}
              >
                {done && <Icon name="check" size={13} strokeWidth={2.6} className="text-accent-text" />}
                <span className="truncate">{s.label}</span>
                {current && counts[s.step] !== undefined && (
                  <span className="shrink-0 rounded-full bg-accent-soft px-1.5 text-[0.75rem] leading-[1.125rem] tabular-nums text-accent-text">
                    {counts[s.step]}
                    <span className="sr-only"> thẻ còn lại</span>
                  </span>
                )}
                {done && <span className="sr-only">, đã xong</span>}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function format(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/**
 * Đồng hồ thời gian của buổi học, tự đếm trong component riêng để cả trang (và thẻ đang ôn) không render lại mỗi giây.
 * Đặt ở ô phải của TopBar.
 */
export function SessionTimer() {
  const [start] = useState(() => Date.now());
  const [now, setNow] = useState(start);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-fill px-2.5 py-1 text-[0.8125rem] font-semibold tabular-nums text-text-2">
      <Icon name="clock" size={14} strokeWidth={2.2} />
      <span className="sr-only">Thời gian học </span>
      {format(Math.floor((now - start) / 1000))}
    </span>
  );
}
