import { Link, useLocation } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { SUMMARY_KEY } from '../api/query-keys';
import { endpoints } from '../api/endpoints';
import { Icon } from '../components/ui/icons';
import { ThemeToggle } from '../components/ui/theme-toggle';
import { UserMenu } from './user-menu';

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Hôm nay',
  '/roadmap': 'Lộ trình',
  '/words': 'Kho từ',
  '/stats': 'Tiến độ',
  '/settings': 'Cá nhân',
  '/ipa': 'Phát âm IPA',
};

/**
 * AppHeader trên desktop (macOS-style Window Toolbar):
 * - Dính đỉnh (sticky), vật liệu kính mờ (`material`), mép bóng cuộn mềm.
 * - Trái: Tiêu đề màn hình hiện tại + nút tắt tìm kiếm nhanh `/`.
 * - Phải: Chuỗi ngày học liên tục (flame chip) + ThemeToggle + UserMenu dropdown.
 */
export function AppHeader() {
  const location = useLocation();
  const summaryQuery = useQuery({ queryKey: SUMMARY_KEY, queryFn: endpoints.summary, meta: { silent: true } });
  const streak = summaryQuery.data?.streak ?? 0;
  const currentTitle = ROUTE_LABELS[location.pathname] ?? 'IELTS App';

  return (
    <header
      data-app-header=""
      aria-label="Thanh công cụ ứng dụng"
      className="material sticky top-0 z-30 hidden h-14 w-full border-b border-separator/80 px-6 shadow-[var(--shadow-scroll-edge)] backdrop-blur-xl lg:flex lg:items-center lg:justify-between lg:px-10"
    >
      {/* Vùng trái: Chỉ báo trang hiện tại + Tìm kiếm nhanh */}
      <div className="flex items-center gap-3">
        <span className="text-base font-bold tracking-tight text-text">
          {currentTitle}
        </span>
        <span aria-hidden="true" className="text-text-3/40">/</span>
        <Link
          to="/words"
          className="pressable focus-ring flex items-center gap-1.5 rounded-lg bg-fill/50 px-2.5 py-1 text-xs font-medium text-text-2 transition-colors hover:bg-fill hover:text-text"
        >
          <Icon name="search" size={14} strokeWidth={2} />
          <span>Tìm từ</span>
          <kbd aria-hidden="true" className="ml-1 inline-flex min-w-4 items-center justify-center rounded bg-surface/90 px-1 py-0.5 text-[10px] font-semibold text-text-3 card-edge">
            /
          </kbd>
        </Link>
      </div>

      {/* Vùng phải: Chuỗi ngày + Theme Toggle + User Menu Dropdown */}
      <div className="flex items-center gap-3">
        {streak > 0 && (
          <Link
            to="/stats"
            title={`Chuỗi ${streak} ngày liên tiếp`}
            className="pressable focus-ring flex items-center gap-1.5 rounded-full bg-warning/12 px-2.5 py-1 text-xs font-semibold text-warning transition-colors hover:bg-warning/20"
          >
            <Icon name="flame" filled size={14} strokeWidth={1.8} />
            <span className="tabular-nums">{streak} ngày</span>
          </Link>
        )}
        <ThemeToggle appearance="plain" className="size-8" />
        <UserMenu />
      </div>
    </header>
  );
}
