import { Link } from 'react-router';
import type { IconName } from '../types/icon';
import { Icon } from '../ui/icons';

export interface CenterActionTarget { to: string; label: string; icon?: IconName }

/** Hành động chính ở giữa tab bar / đầu sidebar. Hiện là buổi học hôm nay; đổi đích ở đây khi có chế độ AI. */
export const CENTER_ACTION: CenterActionTarget = { to: '/session', label: 'Buổi học hôm nay', icon: 'sparkle' };

/**
 * Điện thoại: nút tròn 58px nổi lên trên tab bar, nhãn chỉ cho trình đọc màn hình.
 * ≥lg: nút viên thuốc lớn ở đầu sidebar, nhãn hiện ra.
 */
export function CenterAction({ target = CENTER_ACTION }: { target?: CenterActionTarget }) {
  return (
    <Link
      to={target.to}
      aria-label={target.label}
      data-testid="center-action"
      className={[
        'pressable focus-ring relative inline-flex items-center justify-center rounded-full',
        'bg-accent text-on-accent shadow-float hover:bg-accent-pressed active:bg-accent-pressed',
        // tab bar: tròn, nhô lên khỏi mép trên của thanh
        'size-[58px] -translate-y-[18px]',
        // sidebar: nút rộng có chữ
        'lg:h-12 lg:w-full lg:translate-y-0 lg:justify-start lg:gap-2.5 lg:px-4 lg:shadow-[0_6px_18px_-6px_color-mix(in_srgb,var(--accent)_70%,transparent)]',
      ].join(' ')}
    >
      <Icon name={target.icon ?? 'sparkle'} filled size={26} strokeWidth={1.6} className="lg:size-[22px]" />
      <span className="sr-only lg:not-sr-only lg:text-[0.9375rem] lg:font-semibold">{target.label}</span>
    </Link>
  );
}
