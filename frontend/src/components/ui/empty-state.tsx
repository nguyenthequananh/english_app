import type { ReactNode } from 'react';
import { Icon, type IconName } from './icons';

/** Trạng thái trống: icon trong vòng nhạt, tiêu đề, mô tả, một hành động. */
export function EmptyState({ icon, title, description, action }: {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      {icon && (
        <span className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-accent-soft text-accent-text">
          <Icon name={icon} size={26} />
        </span>
      )}
      <p className="text-xl font-semibold text-text">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-base text-text-2">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
