import type { ChangeEvent, ReactNode } from 'react';
import { useId } from 'react';
import { Link } from 'react-router';
import { Icon } from './icons';
import { Eyebrow } from './section-heading';
import { cn } from './cn';

/*
 * Bảng kiểu cài đặt iOS: `ListGroup` chứa các dòng `<li>`.
 * Dòng: `ListRow` (link / nút / tĩnh), `DownloadRow` (`<a download>`), `FileRow` (chọn file), `GroupItem` (nội dung tự do).
 * Mọi dòng giữ cùng nhịp: cao ≥52px, đường kẻ giữa các dòng thụt vào sau phần `leading`.
 */

/** Nhóm bảng kiểu cài đặt iOS: tiêu đề nhỏ phía trên, thẻ bo góc chứa các dòng, chú thích phía dưới. */
export function ListGroup({ title, footer, children }: { title?: string; footer?: ReactNode; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={title ? id : undefined} className="space-y-1.5">
      {title && <Eyebrow as="h2" id={id} className="px-4">{title}</Eyebrow>}
      <ul className="overflow-hidden rounded-card bg-surface card-edge">{children}</ul>
      {footer && <div className="px-4 text-sm text-text-3">{footer}</div>}
    </section>
  );
}

const rowClass = 'flex w-full items-center gap-3 pl-4 text-left';
const pressClass = 'focus-ring transition-colors duration-(--duration-press) hover:bg-fill active:bg-fill-strong [outline-offset:-2px]';

/** Phần trong của một dòng: leading, tiêu đề + dòng phụ, trailing, chevron. Đường kẻ trên nằm ở đây để thụt sau leading. */
function RowBody({ title, subtitle, leading, trailing, chevron, truncate }: {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  chevron?: boolean;
  truncate?: boolean;
}) {
  return (
    <>
      {leading && <span className="flex shrink-0 items-center">{leading}</span>}
      <span className="flex min-h-[3.25rem] min-w-0 flex-1 items-center gap-3 py-2.5 pr-4 group-[:not(:first-child)]/row:border-t group-[:not(:first-child)]/row:border-separator">
        <span className="min-w-0 flex-1">
          <span className={cn('block text-base text-text', truncate && 'truncate')}>{title}</span>
          {subtitle && <span className="mt-0.5 block text-sm text-text-3">{subtitle}</span>}
        </span>
        {trailing && <span className="flex shrink-0 items-center gap-2 text-base text-text-3">{trailing}</span>}
        {chevron && <Icon name="chevron-right" size={16} strokeWidth={2.4} className="text-text-3 opacity-70" />}
      </span>
    </>
  );
}

/**
 * Một dòng trong ListGroup. `to` ⇒ Link, `onClick` ⇒ button, còn lại là dòng tĩnh.
 * Đường kẻ giữa các dòng thụt vào sau phần `leading` như iOS.
 */
export function ListRow({ title, subtitle, leading, trailing, to, onClick, chevron }: {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  to?: string;
  onClick?: () => void;
  chevron?: boolean;
}) {
  const inner = <RowBody title={title} subtitle={subtitle} leading={leading} trailing={trailing} chevron={chevron ?? Boolean(to)} truncate />;
  return (
    <li className="group/row">
      {to ? (
        <Link to={to} className={cn(rowClass, pressClass)}>{inner}</Link>
      ) : onClick ? (
        <button type="button" onClick={onClick} className={cn(rowClass, pressClass)}>{inner}</button>
      ) : (
        <div className={rowClass}>{inner}</div>
      )}
    </li>
  );
}

/** Dòng tải file: link `download` thường (không qua router), icon tải ở cuối. */
export function DownloadRow({ href, title, subtitle, leading }: { href: string; title: ReactNode; subtitle?: ReactNode; leading?: ReactNode }) {
  return (
    <li className="group/row">
      <a href={href} download className={cn(rowClass, pressClass, 'no-underline')}>
        <RowBody title={title} subtitle={subtitle} leading={leading} trailing={<Icon name="download" size={18} strokeWidth={2.2} className="text-text-3" />} />
      </a>
    </li>
  );
}

/**
 * Dòng chọn file: cả dòng là `<label>` bọc input file ẩn (focus bằng bàn phím vẫn hiện vòng trên dòng).
 * Chọn xong gọi `onFiles` rồi xoá giá trị input, để chọn lại đúng file đó vẫn kích hoạt. `busy` khoá dòng và hiện "Đang nhập…".
 */
export function FileRow({ title, subtitle, leading, inputLabel, accept, multiple, busy, onFiles }: {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  inputLabel: string;
  accept: string;
  multiple?: boolean;
  busy?: boolean;
  onFiles: (files: File[]) => void;
}) {
  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onFiles(files);
    e.target.value = '';
  }
  return (
    <li className="group/row">
      <label
        aria-busy={busy || undefined}
        className={cn(rowClass, pressClass, 'cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset has-[:focus-visible]:ring-[var(--focus-ring)]', busy && 'pointer-events-none opacity-60')}
      >
        <RowBody
          title={title}
          subtitle={subtitle}
          leading={leading}
          trailing={busy ? <span className="text-base">Đang nhập…</span> : <Icon name="upload" size={18} strokeWidth={2.2} className="text-text-3" />}
        />
        <input type="file" accept={accept} multiple={multiple} aria-label={inputLabel} className="sr-only" disabled={busy} onChange={onChange} />
      </label>
    </li>
  );
}

/** Ô nội dung tự do trong ListGroup (thanh trượt, danh sách kết quả, skeleton…), có đường kẻ thụt như các dòng khác. */
export function GroupItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <li className={cn('relative px-4 py-3.5 [&:not(:first-child)]:before:absolute [&:not(:first-child)]:before:top-0 [&:not(:first-child)]:before:right-0 [&:not(:first-child)]:before:left-4 [&:not(:first-child)]:before:h-px [&:not(:first-child)]:before:bg-separator', className)}>
      {children}
    </li>
  );
}
