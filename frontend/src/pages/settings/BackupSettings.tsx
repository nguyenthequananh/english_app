import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { downloads, endpoints } from '../../api/endpoints';
import { toast } from '../../components/Toaster';
import { ShutdownButton } from '../../components/ShutdownButton';

export function BackupSettings() {
  const queryClient = useQueryClient();
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const { data: backups } = useQuery({ queryKey: ['backups'], queryFn: endpoints.backups });
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: endpoints.settings });
  const [dir, setDir] = useState('');
  useEffect(() => {
    if (settings) setDir(settings.backupDir);
  }, [settings]);

  const create = useMutation({
    mutationFn: endpoints.createBackup,
    onSuccess: (b) => {
      toast(`Đã sao lưu: ${b.name}`);
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
  });
  const restore = useMutation({ mutationFn: endpoints.restoreBackup, onSuccess: (r) => setRestoreMessage(r.message) });
  const saveDir = useMutation({
    mutationFn: () => endpoints.updateSettings(dir.trim() || null),
    onSuccess: (s) => {
      queryClient.setQueryData(['settings'], s);
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      toast('Đã lưu thư mục sao lưu');
    },
  });
  const openLogs = useMutation({ mutationFn: endpoints.openLogs });

  return (
    <section className="card space-y-4">
      <h2 className="text-lg font-semibold">Sao lưu & khôi phục</h2>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" disabled={create.isPending} onClick={() => create.mutate()}>Sao lưu ngay</button>
        <a className="btn bg-slate-100" href={downloads.dbExport} download>Tải toàn bộ dữ liệu (.db)</a>
        <button type="button" className="btn bg-slate-100" onClick={() => openLogs.mutate()}>Mở thư mục log</button>
      </div>

      {restoreMessage && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-amber-100 p-3 text-sm">
          <span className="flex-1">{restoreMessage}</span>
          <ShutdownButton />
        </div>
      )}

      <ul className="divide-y divide-slate-100 text-sm">
        {backups?.length === 0 && <li className="py-2 text-slate-500">Chưa có bản sao lưu nào.</li>}
        {backups?.map((b) => (
          <li key={b.name} className="flex items-center gap-3 py-2">
            <span className="font-mono">{b.name}</span>
            <span className="text-slate-500">{Math.ceil(b.sizeBytes / 1024)} KB</span>
            <button type="button" className="btn ml-auto bg-slate-100" aria-label={`Khôi phục ${b.name}`}
              onClick={() => {
                if (window.confirm(`Khôi phục dữ liệu về bản ${b.name}? Dữ liệu hiện tại sẽ được thay thế khi mở lại app.`)) restore.mutate(b.name);
              }}>
              Khôi phục
            </button>
          </li>
        ))}
      </ul>

      <form className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          saveDir.mutate();
        }}>
        <label htmlFor="backup-dir" className="block text-sm font-medium">Thư mục sao lưu</label>
        <p className="text-xs text-slate-500">Có thể chọn thư mục OneDrive/Google Drive để có bản sao ngoài máy. Để trống để dùng mặc định.</p>
        <div className="flex gap-2">
          <input id="backup-dir" className="input" value={dir} onChange={(e) => setDir(e.target.value)} />
          <button type="submit" className="btn bg-slate-100" disabled={saveDir.isPending}>Lưu thư mục</button>
        </div>
      </form>
    </section>
  );
}
