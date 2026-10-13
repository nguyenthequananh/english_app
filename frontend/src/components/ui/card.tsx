import type { HTMLAttributes } from 'react';
import { cn } from './cn';

/**
 * Thẻ trắng bo 22px, phân tầng bằng bóng mềm (sáng) hoặc viền 1px rất mờ (tối).
 * `interactive` thêm phản hồi nhấn — dùng khi cả thẻ là vùng bấm (bọc trong Link/button ở ngoài hoặc onClick).
 */
export function Card({ as: Tag = 'div', padded = true, interactive = false, className, ...rest }: HTMLAttributes<HTMLDivElement> & {
  as?: 'div' | 'section' | 'article';
  padded?: boolean;
  interactive?: boolean;
}) {
  return (
    <Tag
      {...rest}
      className={cn(
        'rounded-card bg-surface text-text card-edge',
        padded && 'p-4 sm:p-5',
        interactive && 'pressable cursor-pointer hover:bg-[color-mix(in_srgb,var(--surface)_94%,var(--text))]',
        className,
      )}
    />
  );
}
