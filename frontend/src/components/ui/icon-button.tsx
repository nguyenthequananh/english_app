import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router';
import { Icon, type IconName } from './icons';
import { cn } from './cn';

/** Nút tròn 44px (đủ vùng chạm), nền kính nhẹ — như nút quay lại của iOS. */
export const iconButtonStyles = cn(
  'pressable focus-ring inline-flex size-11 shrink-0 items-center justify-center rounded-full',
  'bg-surface text-text card-edge hover:bg-surface-2',
  'disabled:cursor-not-allowed disabled:opacity-45',
);

export function IconButton({ icon, label, className, type = 'button', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconName;
  /** Tên accessible (bắt buộc vì nút không có chữ). */
  label: string;
}) {
  return (
    <button type={type} aria-label={label} title={label} {...rest} className={cn(iconButtonStyles, className)}>
      <Icon name={icon} size={20} strokeWidth={2.1} />
    </button>
  );
}

export function IconLink({ icon, label, className, ...rest }: LinkProps & { icon: IconName; label: string }) {
  return (
    <Link aria-label={label} title={label} {...rest} className={cn(iconButtonStyles, className as string)}>
      <Icon name={icon} size={20} strokeWidth={2.1} />
    </Link>
  );
}
