import { useMutation, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../../api/endpoints';

export function ContentSettings() {
  const queryClient = useQueryClient();
  const importContent = useMutation({
    mutationFn: (files: File[]) => endpoints.importContent(files),
    onSuccess: () => queryClient.invalidateQueries(),
  });
  return (
    <section className="card space-y-3">
      <h2 className="text-lg font-semibold">Nội dung học</h2>
      <p className="text-sm text-slate-500">Nhập thêm file nội dung (.json) theo mẫu trong thư mục content/.</p>
      <input type="file" multiple accept=".json,application/json" aria-label="Chọn file nội dung (.json)"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) importContent.mutate(files);
          e.target.value = '';
        }} />
      {importContent.data && (
        <ul className="space-y-2 text-sm">
          {importContent.data.map((r) => (
            <li key={r.file} className={r.ok ? 'text-emerald-700' : 'text-rose-700'}>
              {r.ok ? '✓' : '✗'} {r.file}
              {r.errors.length > 0 && (
                <ul className="ml-6 list-disc text-slate-700">{r.errors.map((err) => <li key={err}>{err}</li>)}</ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
