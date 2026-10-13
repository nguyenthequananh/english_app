import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';

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
    <div role="alert" className="mx-auto mt-3 flex max-w-5xl items-start gap-3 rounded-lg bg-sky-100 px-4 py-3 text-sm text-sky-900">
      <span className="flex-1">{message}</span>
      <button type="button" className="btn btn-ghost" onClick={() => setHidden(true)}>Đóng</button>
    </div>
  );
}
