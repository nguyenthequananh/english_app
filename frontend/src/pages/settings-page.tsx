import { ProfileSettings } from './settings/profile-settings';
import { TransferSettings } from './settings/transfer-settings';
import { ContentSettings } from './settings/content-settings';
import { BackupSettings } from './settings/backup-settings';
import { ShutdownButton } from '../components/shutdown-button';

export default function SettingsPage() {
  return (
    <div data-testid="page-settings" className="space-y-4">
      <h1 className="text-2xl font-bold">Cài đặt</h1>
      <ProfileSettings />
      <TransferSettings />
      <ContentSettings />
      <BackupSettings />
      <section className="card flex items-center gap-3">
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Tắt app</h2>
          <p className="text-sm text-slate-500">Đóng tab trình duyệt không tắt app. Dùng nút này khi muốn tắt hẳn.</p>
        </div>
        <ShutdownButton />
      </section>
    </div>
  );
}
