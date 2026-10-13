import type { ReactNode } from 'react';
import { Eyebrow } from './section-heading';

/**
 * Nhóm form kiểu iOS grouped: tiêu đề nhỏ phía trên, thẻ chứa các ô nhập (có đệm, các ô cách nhau), chú thích phía dưới.
 * Khác `ListGroup`: bên trong là ô nhập tự do chứ không phải các dòng `<li>` có đường kẻ.
 */
export function FormGroup({ title, footer, children }: { title?: string; footer?: string; children: ReactNode }) {
  return (
    <section className="space-y-1.5">
      {title && <Eyebrow as="h2" className="px-4">{title}</Eyebrow>}
      <div className="space-y-4 rounded-card bg-surface p-4 card-edge sm:p-5">{children}</div>
      {footer && <p className="px-4 text-sm text-text-3">{footer}</p>}
    </section>
  );
}
