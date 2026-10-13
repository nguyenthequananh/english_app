import { useMutation } from '@tanstack/react-query';
import { endpoints } from '../../api/endpoints';
import { toast } from '../../components/toaster';
import { ShutdownButton } from '../../components/shutdown-button';
import { ListGroup, ListRow } from '../../components/ui/list-row';
import { IconChip } from './settings-rows';

/** Nhóm "Ứng dụng": mở thư mục log, tắt hẳn app. */
export function AppSettings() {
  const openLogs = useMutation({ mutationFn: endpoints.openLogs, onSuccess: () => toast('Đã mở thư mục log') });
  return (
    <div className="space-y-3">
      <ListGroup title="Ứng dụng" footer="Đóng tab trình duyệt không tắt app. Dùng nút Tắt app khi muốn tắt hẳn.">
        <ListRow
          leading={<IconChip icon="book" tone="neutral" />}
          title="Mở thư mục log"
          subtitle="Gửi kèm file log khi báo lỗi"
          onClick={() => openLogs.mutate()}
        />
      </ListGroup>
      <div className="[&>button]:w-full">
        <ShutdownButton />
      </div>
    </div>
  );
}
