import type { ReactNode } from 'react';
import type { Skill } from '../types/skill';
import { toneClass } from './skill';
import { cn } from './cn';

/** Nhãn nhỏ dạng viên thuốc: nền nhuộm nhạt + chữ cùng tông (đã làm đậm để đạt AA ở chế độ sáng). */
export function Badge({ tone = 'neutral', children, className }: {
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | Skill;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-[var(--tone-soft)] px-2.5 py-0.5 text-[0.75rem] font-semibold leading-5 whitespace-nowrap text-[var(--tone-text)]',
        toneClass(tone),
        className,
      )}
    >
      {children}
    </span>
  );
}
