import type { ReactNode } from 'react';
import { IconLink } from './icon-button';

/** Đầu màn chính: tiêu đề lớn kiểu iOS (h1 ~34px) + phụ đề + hành động bên phải; `back` thêm nút quay lại tròn. */
export function PageHeader({ title, subtitle, back, backLabel = 'Quay lại', actions }: {
  title: string;
  subtitle?: ReactNode;
  back?: string;
  backLabel?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="pt-4 pb-5 lg:pt-8 lg:pb-6">
      {back && <IconLink to={back} icon="back" label={backLabel} className="mb-3" />}
      <div className="flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-large-title text-balance text-text">{title}</h1>
          {subtitle && <div className="mt-1 text-[0.9375rem] leading-snug text-text-2">{subtitle}</div>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2 pb-1">{actions}</div>}
      </div>
    </header>
  );
}
