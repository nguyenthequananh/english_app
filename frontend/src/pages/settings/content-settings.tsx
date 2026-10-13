import { useMutation, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../../api/endpoints';
import { ListGroup } from '../../ui/list-row';
import { Badge } from '../../ui/badge';
import { Icon } from '../../ui/icons';
import { FileRow, GroupItem, IconChip } from './settings-rows';

/** Nhóm "Nội dung": nhập thêm file bài học (.json), hiện kết quả từng file. */
export function ContentSettings() {
  const queryClient = useQueryClient();
  const importContent = useMutation({
    mutationFn: (files: File[]) => endpoints.importContent(files),
    onSuccess: () => queryClient.invalidateQueries(),
  });
  return (
    <ListGroup title="Nội dung" footer="Thêm bài học theo mẫu trong thư mục content/ của app.">
      <FileRow
        leading={<IconChip icon="book" tone="grammar" />}
        title="Nhập file nội dung"
        subtitle="Một hoặc nhiều file .json"
        inputLabel="Chọn file nội dung (.json)"
        accept=".json,application/json"
        multiple
        busy={importContent.isPending}
        onFiles={(files) => importContent.mutate(files)}
      />
      {importContent.data?.map((r) => (
        <GroupItem key={r.file}>
          <div className="flex items-start gap-3">
            <span className={`${r.ok ? 'tone-success' : 'tone-danger'} mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--tone-soft)] text-[var(--tone-text)]`}>
              <Icon name={r.ok ? 'check' : 'cross'} size={14} strokeWidth={2.8} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 text-base font-medium break-all text-text">{r.file}</span>
                <Badge tone={r.ok ? 'success' : 'danger'}>{r.ok ? 'Đã nhập' : 'Lỗi'}</Badge>
              </div>
              {r.errors.length > 0 && (
                <ul className="mt-1.5 space-y-1 text-sm break-words text-text-2">
                  {r.errors.map((err) => <li key={err}>{err}</li>)}
                </ul>
              )}
            </div>
          </div>
        </GroupItem>
      ))}
    </ListGroup>
  );
}
