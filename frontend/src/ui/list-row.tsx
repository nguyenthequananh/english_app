import type { ReactNode } from 'react';
import { useId } from 'react';
import { Link } from 'react-router';
import { Icon } from './icons';
import { cn } from './cn';

/** Nhóm bảng kiểu cài đặt iOS: tiêu đề nhỏ phía trên, thẻ bo góc chứa các dòng, chú thích phía dưới. */
export function ListGroup({ title, footer, children }: { title?: string; footer?: ReactNode; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={title ? id : undefined} className="space-y-1.5">
      {title && (
        <h2 id={id} className="px-4 text-sm font-semibold uppercase tracking-[0.04em] text-text-3">{title}</h2>
      )}
      <ul className="overflow-hidden rounded-card bg-surface card-edge">{children}</ul>
      {footer && <div className="px-4 text-sm text-text-3">{footer}</div>}
    </section>
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
  const showChevron = chevron ?? Boolean(to);
  const inner = (
    <>
      {leading && <span className="flex shrink-0 items-center">{leading}</span>}
      <span className="flex min-h-[3.25rem] min-w-0 flex-1 items-center gap-3 py-2.5 pr-4 group-[:not(:first-child)]/row:border-t group-[:not(:first-child)]/row:border-separator">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base text-text">{title}</span>
          {subtitle && <span className="mt-0.5 block text-sm text-text-3">{subtitle}</span>}
        </span>
        {trailing && <span className="flex shrink-0 items-center gap-2 text-base text-text-3">{trailing}</span>}
        {showChevron && <Icon name="chevron-right" size={16} strokeWidth={2.4} className="text-text-3 opacity-70" />}
      </span>
    </>
  );
  const rowClass = 'flex w-full items-center gap-3 pl-4 text-left';
  const pressClass = 'focus-ring transition-colors duration-(--duration-press) hover:bg-fill active:bg-fill-strong [outline-offset:-2px]';
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
