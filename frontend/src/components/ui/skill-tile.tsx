import { Link } from 'react-router';
import type { Skill } from '../../types/skill';
import { Icon, type IconName } from './icons';
import { toneClass } from './skill';
import { cn } from './cn';

/**
 * Ô "Luyện tập" (như "Practice Now"): vòng màu + icon + nhãn; cả ô là một Link.
 * - `tone`: màu kỹ năng chỉ khi đích thuộc về một loại bài (Ôn thẻ → từ vựng, IPA → phát âm);
 *   đích không phải kỹ năng (Kho từ, Lộ trình) dùng `accent`/`neutral`, không mượn màu kỹ năng.
 * - `ariaLabel`: tên đọc khác nhãn — ô "Lộ trình" đọc là "Mở lộ trình" để không trùng mục điều hướng.
 * - `align`: `top` (mặc định) neo icon ở đỉnh để các ô cùng hàng thẳng icon khi một nhãn xuống 2 dòng
 *   ("Phát âm IPA" ở 390px); `center` căn giữa dọc cho ô đứng riêng.
 */
export function SkillTile({ to, label, ariaLabel, icon, tone, align = 'top', className }: {
  to: string;
  label: string;
  ariaLabel?: string;
  icon: IconName;
  tone: Skill | 'accent' | 'neutral';
  align?: 'top' | 'center';
  className?: string;
}) {
  return (
    <Link
      to={to}
      aria-label={ariaLabel}
      data-align={align}
      className={cn(
        'pressable focus-ring flex min-h-[6.75rem] flex-col items-center gap-2.5 rounded-card bg-surface px-1.5 pt-4 pb-3 text-center card-edge',
        align === 'center' && 'justify-center pb-4',
        'hover:bg-[color-mix(in_srgb,var(--surface)_94%,var(--text))] lg:hover:-translate-y-0.5 lg:hover:shadow-card',
        toneClass(tone),
        className,
      )}
    >
      <span className="tone-chip inline-flex size-12 shrink-0 items-center justify-center rounded-full shadow-[0_6px_14px_-6px_var(--tone)] dark:shadow-none">
        <Icon name={icon} size={23} strokeWidth={2} />
      </span>
      <span className="text-sm font-semibold text-balance text-text">{label}</span>
    </Link>
  );
}
