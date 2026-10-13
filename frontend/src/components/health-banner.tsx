import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import { Button } from '../ui/button';
import { Icon } from '../ui/icons';

export function HealthBanner() {
  const [hidden, setHidden] = useState(false);
  const { data } = useQuery({ queryKey: ['health'], queryFn: endpoints.health, meta: { silent: true } });
  if (!data || hidden) return null;
  let message: string | null = null;
  if (data.recoveredFrom === 'NONE') {
    message = 'Dữ liệu bị hỏng và không có bản sao lưu dùng được, app đã tạo dữ liệu mới. File hỏng vẫn được giữ trong thư mục dữ liệu.';
  } else if (data.recoveredFrom) {
    message = `Dữ liệu bị hỏng nên app đã tự khôi phục từ bản sao lưu ${data.recoveredFrom}.`;
  } else if (data.restoredFrom) {
    message = `Đã khôi phục dữ liệu từ bản sao lưu ${data.restoredFrom}.`;
  }
  if (!message) return null;
  return (
    <div role="alert" className="tone-grammar mt-4 flex items-start gap-3 rounded-card bg-surface p-4 card-edge">
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--tone-soft)] text-[var(--tone-text)]">
        <Icon name="download" size={18} strokeWidth={2.1} />
      </span>
      <p className="min-w-0 flex-1 pt-1.5 text-[0.9375rem] leading-snug break-words text-text">{message}</p>
      <Button variant="ghost" size="sm" onClick={() => setHidden(true)}>Đóng</Button>
    </div>
  );
}
