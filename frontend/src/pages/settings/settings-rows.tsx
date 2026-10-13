import type { ChangeEvent, ReactNode } from 'react';
import type { IconName } from '../../types/icon';
import { Icon } from '../../ui/icons';
import { cn } from '../../ui/cn';

/*
 * Biến thể dòng cho ListGroup mà `ListRow` (src/ui) chưa có: dòng là <a download>, dòng chọn file,
 * và ô nội dung tự do. Giữ đúng nhịp của ListRow (cao ≥52px, đường kẻ thụt sau phần leading).
 * Ứng viên gom về src/ui sau.
 */

/** Ô icon vuông bo kiểu Cài đặt iOS: nền màu tông + glyph trắng (tối: nền nhuộm + glyph màu). */
export function IconChip({ icon, tone = 'accent' }: { icon: IconName; tone?: 'accent' | 'success' | 'warning' | 'danger' | 'neutral' | 'grammar' | 'listening' | 'pronunciation' }) {
  return (
    <span aria-hidden="true" className={cn(`tone-${tone}`, 'tone-chip inline-flex size-[30px] items-center justify-center rounded-[9px]')}>
      <Icon name={icon} size={17} strokeWidth={2.2} />
    </span>
  );
}

const rowClass = 'flex w-full items-center gap-3 pl-4 text-left';
const pressClass = 'focus-ring transition-colors duration-150 hover:bg-fill active:bg-fill-strong [outline-offset:-2px]';

function RowInner({ title, subtitle, leading, trailing }: { title: ReactNode; subtitle?: ReactNode; leading?: ReactNode; trailing?: ReactNode }) {
  return (
    <>
      {leading && <span className="flex shrink-0 items-center">{leading}</span>}
      <span className="flex min-h-[3.25rem] min-w-0 flex-1 items-center gap-3 py-2.5 pr-4 group-[:not(:first-child)]/row:border-t group-[:not(:first-child)]/row:border-separator">
        <span className="min-w-0 flex-1">
          <span className="block text-[1rem] leading-snug text-text">{title}</span>
          {subtitle && <span className="mt-0.5 block text-[0.8125rem] leading-snug text-text-3">{subtitle}</span>}
        </span>
        {trailing && <span className="flex shrink-0 items-center gap-2 text-[0.9375rem] text-text-3">{trailing}</span>}
      </span>
    </>
  );
}

/** Dòng tải file (link `download`, không qua router). */
export function DownloadRow({ href, title, subtitle, leading }: { href: string; title: ReactNode; subtitle?: ReactNode; leading?: ReactNode }) {
  return (
    <li className="group/row">
      <a href={href} download className={cn(rowClass, pressClass, 'no-underline')}>
        <RowInner title={title} subtitle={subtitle} leading={leading} trailing={<Icon name="download" size={18} strokeWidth={2.2} className="text-text-3" />} />
      </a>
    </li>
  );
}

/** Dòng chọn file: cả dòng là <label> bọc input file ẩn (focus bằng bàn phím vẫn hiện vòng trên dòng). */
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
        <RowInner
          title={title}
          subtitle={subtitle}
          leading={leading}
          trailing={busy ? <span className="text-[0.875rem]">Đang nhập…</span> : <Icon name="upload" size={18} strokeWidth={2.2} className="text-text-3" />}
        />
        <input type="file" accept={accept} multiple={multiple} aria-label={inputLabel} className="sr-only" disabled={busy} onChange={onChange} />
      </label>
    </li>
  );
}

/** Ô nội dung tự do trong nhóm (form, danh sách kết quả…), có đường kẻ thụt như các dòng khác. */
export function GroupItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <li className={cn('relative px-4 py-3.5 [&:not(:first-child)]:before:absolute [&:not(:first-child)]:before:top-0 [&:not(:first-child)]:before:right-0 [&:not(:first-child)]:before:left-4 [&:not(:first-child)]:before:h-px [&:not(:first-child)]:before:bg-separator', className)}>
      {children}
    </li>
  );
}
