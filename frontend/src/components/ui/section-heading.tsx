import type { ReactNode } from 'react';
import { cn } from './cn';

/**
 * Nhãn nhỏ viết hoa (eyebrow) đứng trên một khối: "BUỔI HỌC HÔM NAY", "CHẶNG S1", tiêu đề nhóm của ListGroup/FormGroup.
 * `as` chọn thẻ theo ngữ nghĩa chỗ dùng (tiêu đề nhóm là `h2`, chú thích fieldset là `legend`); mặc định `p`.
 */
export function Eyebrow({ as: Tag = 'p', id, className, children }: {
  as?: 'p' | 'span' | 'h2' | 'h3' | 'legend';
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag id={id} className={cn('text-sm font-semibold uppercase tracking-[0.04em] text-text-3', className)}>
      {children}
    </Tag>
  );
}

/**
 * Tiêu đề mục trong trang (bậc 2xl, `h2`), tuỳ chọn `aside` canh đáy chữ ở bên phải (số đếm, chú thích).
 * `id` để `<section aria-labelledby>` trỏ vào; `className` cho khoảng cách của từng chỗ dùng.
 */
export function SectionTitle({ id, aside, className, children }: {
  id?: string;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('flex items-baseline justify-between gap-3', className)}>
      <h2 id={id} className="text-2xl font-bold text-text">{children}</h2>
      {aside}
    </div>
  );
}
