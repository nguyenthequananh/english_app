import { ProfileSettings } from './settings/ProfileSettings';
import { TransferSettings } from './settings/TransferSettings';
import { ContentSettings } from './settings/ContentSettings';
import { BackupSettings } from './settings/BackupSettings';
import { ShutdownButton } from '../components/ShutdownButton';

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
