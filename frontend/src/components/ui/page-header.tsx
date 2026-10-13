import type { ReactNode } from 'react';
import { IconLink } from './icon-button';
import { cn } from './cn';

/** Quá độ dài này (vd. "Chào, " + tên hồ sơ 30 ký tự) thì dưới lg hạ tiêu đề một bậc để không chiếm 3 dòng ở 320px. */
const LONG_TITLE = 20;

/** Đầu màn chính: tiêu đề lớn kiểu iOS (h1 ~34px) + phụ đề + hành động bên phải; `back` thêm nút quay lại tròn. */
export function PageHeader({ title, subtitle, back, backLabel = 'Quay lại', actions }: {
  title: string;
  subtitle?: ReactNode;
  back?: string;
  backLabel?: string;
  actions?: ReactNode;
}) {
  const long = title.length > LONG_TITLE;
  return (
    <header className="pt-4 pb-5 lg:pt-8 lg:pb-6">
      {back && <IconLink to={back} icon="back" label={backLabel} className="mb-3" />}
      <div className="flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <h1
            className={cn('text-large-title text-balance text-text', long && 'line-clamp-2 break-words max-lg:text-4xl')}
            title={long ? title : undefined}
          >
            {title}
          </h1>
          {subtitle && <div className="mt-1 text-base text-text-2">{subtitle}</div>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2 pb-1">{actions}</div>}
      </div>
    </header>
  );
}
