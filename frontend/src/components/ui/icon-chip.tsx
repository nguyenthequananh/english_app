import type { IconName } from '../../types/icon';
import type { Skill } from '../../types/skill';
import { Icon } from './icons';
import { SKILL_META } from './skill';
import { cn } from './cn';

export type IconChipTone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral' | (typeof SKILL_META)[Skill]['color'];

/** Ô icon vuông bo kiểu Cài đặt iOS, đặt ở `leading` của ListRow: nền màu tông + glyph trắng (tối: nền nhuộm + glyph màu). */
export function IconChip({ icon, tone = 'accent' }: { icon: IconName; tone?: IconChipTone }) {
  return (
    <span aria-hidden="true" className={cn(`tone-${tone}`, 'tone-chip inline-flex size-[30px] items-center justify-center rounded-[9px]')}>
      <Icon name={icon} size={17} strokeWidth={2.2} />
    </span>
  );
}
