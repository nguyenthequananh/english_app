import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

export const buttonStyles = cva(
  [
    'pressable focus-ring relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap',
    'rounded-full font-semibold no-underline',
    'disabled:cursor-not-allowed disabled:opacity-45 aria-disabled:cursor-not-allowed aria-disabled:opacity-45',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-accent text-on-accent shadow-[0_4px_14px_-4px_color-mix(in_srgb,var(--accent)_60%,transparent)] active:bg-accent-pressed hover:bg-accent-pressed',
        secondary: 'bg-accent-soft text-accent-text active:bg-[color-mix(in_srgb,var(--accent)_22%,transparent)] hover:bg-[color-mix(in_srgb,var(--accent)_20%,transparent)]',
        ghost: 'bg-transparent text-accent-text hover:bg-fill active:bg-fill',
        danger: 'bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-danger-text hover:bg-[color-mix(in_srgb,var(--danger)_18%,transparent)] active:bg-[color-mix(in_srgb,var(--danger)_22%,transparent)]',
        /* Nút xác nhận thao tác phá huỷ (ConfirmDialog): nền đỏ đặc, chữ trắng — đạt AA ở cả sáng lẫn tối. */
        'danger-solid': 'bg-danger-solid text-on-accent hover:bg-[color-mix(in_oklab,var(--danger-solid)_88%,black)] active:bg-[color-mix(in_oklab,var(--danger-solid)_82%,black)]',
      },
      size: {
        sm: 'min-h-9 px-3.5 text-md',
        md: 'min-h-11 px-5 text-base',
        lg: 'min-h-13 px-6 text-lg',
      },
      block: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'primary', size: 'md', block: false },
  },
);

type ButtonVariants = Omit<VariantProps<typeof buttonStyles>, 'block'>;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: NonNullable<ButtonVariants['variant']>;
  size?: NonNullable<ButtonVariants['size']>;
  /** Đang xử lý: khoá nút + aria-busy, giữ nguyên chữ để tên accessible không đổi. */
  loading?: boolean;
  block?: boolean;
};

function Spinner() {
  return (
    <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
      <svg viewBox="0 0 24 24" width="18" height="18" className="animate-spin">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
        <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function Button({ variant, size, loading = false, block = false, className, disabled, children, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading ? 'true' : undefined}
      className={cn(buttonStyles({ variant, size, block }), className)}
    >
      {loading ? (
        <>
          {/* Chữ vẫn trong cây accessibility (opacity, không dùng visibility) để tên nút không đổi; chỉ ẩn bằng mắt để nhường chỗ vòng quay. */}
          <span className="inline-flex items-center gap-2 opacity-0">{children}</span>
          <Spinner />
        </>
      ) : children}
    </button>
  );
}

export type ButtonLinkProps = LinkProps & {
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  block?: boolean;
};

export function ButtonLink({ variant, size, block = false, className, ...rest }: ButtonLinkProps) {
  return <Link {...rest} className={cn(buttonStyles({ variant, size, block }), className as string)} />;
}
