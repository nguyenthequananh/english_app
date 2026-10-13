import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { downloads, endpoints } from '../../api/endpoints';
import type { BackupInfo, Settings } from '../../types/api';
import { toast } from '../../components/toaster';
import { ShutdownButton } from '../../components/shutdown-button';
import { ListGroup, ListRow } from '../../components/ui/list-row';
import { Button } from '../../components/ui/button';
import { Sheet } from '../../components/ui/sheet';
import { ConfirmDialog } from '../../components/ui/dialog';
import { TextField } from '../../components/ui/text-field';
import { Skeleton } from '../../components/ui/skeleton';
import { Icon } from '../../components/ui/icons';
import { DownloadRow, GroupItem, IconChip } from './settings-rows';

function formatSize(bytes: number) {
  const kb = Math.ceil(bytes / 1024);
  return kb < 1024 ? `${kb} KB` : `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}

/** "2026-10-06T09:00" → "06/10/2026 09:00" (giữ nguyên nếu không đúng dạng). */
function formatDateTime(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}` : iso;
}

/** Nhóm "Sao lưu": sao lưu ngay, tải .db, thư mục sao lưu; danh sách bản sao lưu để khôi phục. */
export function BackupSettings() {
  const queryClient = useQueryClient();
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<BackupInfo | null>(null);
  const [editingDir, setEditingDir] = useState(false);
  const backupsQuery = useQuery({ queryKey: ['backups'], queryFn: endpoints.backups });
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: endpoints.settings });
  const backups = backupsQuery.data;

  const create = useMutation({
    mutationFn: endpoints.createBackup,
    onSuccess: (b) => {
      toast(`Đã sao lưu: ${b.name}`);
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
  });
  const restore = useMutation({ mutationFn: endpoints.restoreBackup, onSuccess: (r) => setRestoreMessage(r.message) });

  return (
    <>
      <ListGroup title="Sao lưu">
        <ListRow
          leading={<IconChip icon="plus" tone="success" />}
          title={create.isPending ? 'Đang sao lưu…' : 'Sao lưu ngay'}
          onClick={() => { if (!create.isPending) create.mutate(); }}
        />
        <DownloadRow href={downloads.dbExport} leading={<IconChip icon="download" tone="success" />} title="Tải toàn bộ dữ liệu (.db)" />
        <ListRow
          leading={<IconChip icon="settings" tone="neutral" />}
          title="Thư mục sao lưu"
          subtitle={settings ? <span className="[overflow-wrap:anywhere]">{settings.backupDir}</span> : undefined}
          chevron
          onClick={() => setEditingDir(true)}
        />
      </ListGroup>

      {restoreMessage && (
        <div role="status" className="tone-warning flex flex-col gap-3 rounded-card bg-[var(--tone-soft)] p-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-base text-text">{restoreMessage}</p>
          <ShutdownButton />
        </div>
      )}

      <ListGroup title="Bản sao lưu" footer="Khôi phục sẽ thay dữ liệu hiện tại khi mở lại app.">
        {backupsQuery.isPending ? (
          <GroupItem><Skeleton className="h-10" /><span className="sr-only">Đang tải…</span></GroupItem>
        ) : backupsQuery.error ? (
          <GroupItem>
            <div className="flex items-center gap-3">
              <p className="flex-1 text-base text-text-2">Không tải được danh sách bản sao lưu.</p>
              <Button size="sm" variant="secondary" onClick={() => backupsQuery.refetch()}>Thử lại</Button>
            </div>
          </GroupItem>
        ) : backups && backups.length === 0 ? (
          <GroupItem><p className="py-1 text-base text-text-2">Chưa có bản sao lưu nào.</p></GroupItem>
        ) : (
          backups?.map((b) => (
            <ListRow
              key={b.name}
              title={<span className="tabular-nums">{formatDateTime(b.createdAt)}<span className="text-text-3"> · {formatSize(b.sizeBytes)}</span></span>}
              subtitle={<span className="[overflow-wrap:anywhere]">{b.name}</span>}
              trailing={
                <Button size="sm" variant="secondary" aria-label={`Khôi phục ${b.name}`} onClick={() => setRestoring(b)}>
                  Khôi phục
                </Button>
              }
            />
          ))
        )}
      </ListGroup>

      <ConfirmDialog
        open={restoring !== null}
        onOpenChange={(o) => { if (!o) setRestoring(null); }}
        title={restoring ? `Khôi phục dữ liệu về bản ${restoring.name}?` : 'Khôi phục dữ liệu?'}
        description="Dữ liệu hiện tại sẽ được thay thế khi mở lại app."
        confirmLabel="Khôi phục"
        destructive
        onConfirm={() => { if (restoring) restore.mutate(restoring.name); }}
      />

      <Sheet open={editingDir} onOpenChange={setEditingDir} title="Thư mục sao lưu" description="Có thể chọn thư mục OneDrive/Google Drive để có bản sao ngoài máy.">
        <BackupDirForm settings={settings} onSaved={() => setEditingDir(false)} />
      </Sheet>
    </>
  );
}

function BackupDirForm({ settings, onSaved }: { settings: Settings | undefined; onSaved: () => void }) {
  const queryClient = useQueryClient();
  const [dir, setDir] = useState(settings?.backupDir ?? '');
  const saveDir = useMutation({
    mutationFn: () => endpoints.updateSettings(dir.trim() || null),
    onSuccess: (s) => {
      queryClient.setQueryData(['settings'], s);
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      toast('Đã lưu thư mục sao lưu');
      onSaved();
    },
  });
  function submit(e: FormEvent) {
    e.preventDefault();
    saveDir.mutate();
  }
  return (
    <form className="space-y-4" onSubmit={submit}>
      <TextField
        label="Đường dẫn thư mục"
        hint="Để trống để dùng thư mục mặc định."
        autoCapitalize="none"
        autoComplete="off"
        spellCheck={false}
        value={dir}
        onChange={(e) => setDir(e.target.value)}
      />
      <Button type="submit" block size="lg" loading={saveDir.isPending}>
        <Icon name="check" size={18} strokeWidth={2.4} />
        Lưu thư mục
      </Button>
    </form>
  );
}
