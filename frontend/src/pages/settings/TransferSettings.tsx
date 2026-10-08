import { useMutation, useQueryClient } from '@tanstack/react-query';
import { downloads, endpoints } from '../../api/endpoints';
import { ApiError } from '../../api/client';
import { notifyError, toast } from '../../components/Toaster';

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
    <section className="card space-y-3">
      <h2 className="text-lg font-semibold">Xuất / nhập hồ sơ</h2>
      <p className="text-sm text-slate-500">Dùng để chuyển một hồ sơ sang máy khác. File có chứa mã PIN đã mã hoá, hãy giữ kín.</p>
      <div className="flex flex-wrap items-center gap-3">
        <a className="btn bg-slate-100" href={downloads.profileExport} download>Xuất hồ sơ (JSON)</a>
        <label className="btn bg-slate-100 cursor-pointer">
          Nhập hồ sơ từ file
          <input type="file" accept=".json,application/json" className="sr-only" aria-label="Nhập hồ sơ từ file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importProfile.mutate(file);
              e.target.value = '';
            }} />
        </label>
      </div>
    </section>
  );
}
