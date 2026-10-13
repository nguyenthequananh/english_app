import type { ReactNode } from 'react';
import type { Skill } from '../../types/skill';
import { Icon, type IconName } from './icons';
import { toneClass } from './skill';
import { cn } from './cn';

/** Ô số liệu: icon màu + số lớn (tabular-nums) + nhãn. `testId` gắn lên phần tử chứa số. */
export function StatTile({ icon, tone = 'accent', value, label, testId, className }: {
  icon: IconName;
  tone?: Skill | 'accent' | 'warning';
  value: ReactNode;
  label: string;
  testId?: string;
  className?: string;
}) {
  return (
    <div className={cn('@container flex flex-col gap-2 rounded-card bg-surface p-4 card-edge', toneClass(tone), className)}>
      <span className="inline-flex size-9 items-center justify-center rounded-full bg-[var(--tone-soft)] text-[var(--tone-text)]">
        <Icon name={icon} size={19} strokeWidth={2} />
      </span>
      <div>
        {/* Cỡ số theo bề rộng ô (container query): lưới 3 ô ở 320px chỉ còn ~57px cho "1.460g". */}
        <div data-testid={testId} className="text-xl font-bold tabular-nums text-text @[4.5rem]:text-2xl @[7rem]:text-3xl">{value}</div>
        <div className="mt-0.5 text-sm text-text-3">{label}</div>
      </div>
    </div>
  );
}
