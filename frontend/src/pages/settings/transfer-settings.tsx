import { useMutation, useQueryClient } from '@tanstack/react-query';
import { downloads, endpoints } from '../../api/endpoints';
import { ApiError } from '../../api/api-error';
import { notifyError, toast } from '../../components/toaster';
import { ListGroup } from '../../ui/list-row';
import { DownloadRow, FileRow, IconChip } from './settings-rows';

/** Nhóm "Chuyển hồ sơ": xuất hồ sơ hiện tại ra JSON, nhập hồ sơ từ file. */
export function TransferSettings() {
  const queryClient = useQueryClient();
  const importProfile = useMutation({
    mutationFn: async (file: File) => {
      let data: unknown;
      try {
        data = JSON.parse(await file.text());
      } catch {
        throw new Error('File không phải JSON hợp lệ');
      }
      return endpoints.importProfile(data);
    },
    onSuccess: (r) => {
      toast(`Đã nhập hồ sơ "${r.profile.name}"${r.skippedRows ? ` (bỏ qua ${r.skippedRows} dòng không khớp nội dung)` : ''}`);
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
    onError: (e) => {
      if (e instanceof ApiError) notifyError(e);
      else toast(e instanceof Error ? e.message : 'Nhập hồ sơ thất bại', 'error');
    },
    meta: { silent: true },
  });
  return (
    <ListGroup title="Chuyển hồ sơ" footer="Dùng để chuyển một hồ sơ sang máy khác. File có chứa mã PIN đã mã hoá, hãy giữ kín.">
      <DownloadRow href={downloads.profileExport} leading={<IconChip icon="download" tone="listening" />} title="Xuất hồ sơ (JSON)" />
      <FileRow
        leading={<IconChip icon="upload" tone="listening" />}
        title="Nhập hồ sơ từ file"
        inputLabel="Nhập hồ sơ từ file"
        accept=".json,application/json"
        busy={importProfile.isPending}
        onFiles={([file]) => importProfile.mutate(file)}
      />
    </ListGroup>
  );
}
