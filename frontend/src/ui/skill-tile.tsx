import { Link } from 'react-router';
import type { Skill } from '../types/skill';
import { Icon, type IconName } from './icons';
import { toneClass } from './skill';
import { cn } from './cn';

/** Ô "Luyện tập" (như "Practice Now"): vòng màu + icon + nhãn; cả ô là một Link. */
export function SkillTile({ to, label, icon, tone, className }: {
  to: string;
  label: string;
  icon: IconName;
  tone: Skill | 'accent';
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        'pressable focus-ring group flex min-h-[6.5rem] flex-col items-center justify-center gap-2.5 rounded-card bg-surface px-2 py-4 text-center card-edge',
        'hover:bg-[color-mix(in_srgb,var(--surface)_94%,var(--text))]',
        toneClass(tone),
        className,
      )}
    >
      <span className="tone-chip inline-flex size-12 items-center justify-center rounded-full shadow-[0_6px_14px_-6px_var(--tone)] dark:shadow-none">
        <Icon name={icon} size={23} strokeWidth={2} />
      </span>
      <span className="text-sm font-semibold text-text">{label}</span>
    </Link>
  );
}
