import { useCurrentProfile } from '../shell/require-profile';
import { QueryError } from '../components/query-error';
import { PageHeader } from '../components/ui/page-header';
import { Skeleton } from '../components/ui/skeleton';
import { ProfileCard, ProfileSettings } from './settings/profile-settings';
import { VoiceSettings } from './settings/voice-settings';
import { ContentSettings } from './settings/content-settings';
import { BackupSettings } from './settings/backup-settings';
import { TransferSettings } from './settings/transfer-settings';
import { AppSettings } from './settings/app-settings';
import { AppearanceSettings } from './settings/appearance-settings';
import { ThemeToggle } from '../components/ui/theme-toggle';

/**
 * Cá nhân: thẻ hồ sơ + các nhóm cài đặt kiểu iOS. Điện thoại một cột; ≥lg hai cột
 * (trái: hồ sơ, giọng đọc, giao diện; phải: nội dung, sao lưu, chuyển hồ sơ, ứng dụng).
 */
export default function SettingsPage() {
  const profileQuery = useCurrentProfile();
  const profile = profileQuery.data;

  return (
    <div data-testid="page-settings">
      {/* Nút sáng/tối nhanh ở tiêu đề chỉ dưới lg — ≥lg nút đó đã nằm cuối sidebar (tránh hai nút trùng tên). */}
      <PageHeader title="Cá nhân" subtitle="Hồ sơ, giọng đọc và dữ liệu của bạn." actions={<ThemeToggle className="lg:hidden" />} />
      {profileQuery.error ? (
        <QueryError error={profileQuery.error} onRetry={() => profileQuery.refetch()} />
      ) : !profile ? (
        <div className="space-y-6" aria-busy="true">
          <span className="sr-only">Đang tải…</span>
          <Skeleton className="h-24 rounded-card" />
          <Skeleton className="h-32 rounded-card" />
          <Skeleton className="h-40 rounded-card" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
          <div className="min-w-0 space-y-6">
            <ProfileCard profile={profile} />
            <ProfileSettings profile={profile} />
            <VoiceSettings key={profile.id} profile={profile} />
            <AppearanceSettings />
          </div>
          <div className="min-w-0 space-y-6">
            <ContentSettings />
            <BackupSettings />
            <TransferSettings />
            <AppSettings />
          </div>
        </div>
      )}
    </div>
  );
}
