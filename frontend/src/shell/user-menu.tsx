import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Menu } from '@base-ui/react/menu';
import { useMutation } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { useCurrentProfile } from './require-profile';
import { endpoints } from '../api/endpoints';
import { Icon } from '../components/ui/icons';
import { ConfirmDialog } from '../components/ui/dialog';

/**
 * Menu tài khoản người dùng kiểu macOS (Menu dropdown):
 * - Neo tại trigger avatar ở header (`transform-origin: var(--transform-origin)`).
 * - Hiệu ứng trượt nhẹ và phóng từ 0.95 với vật liệu kính mờ cao cấp (`material-strong`).
 * - Bao gồm: Thông tin hồ sơ, Cài đặt & Cá nhân, Tiến độ, Kho từ, Đổi hồ sơ và Tắt app.
 */
export function UserMenu() {
  const { data: profile } = useCurrentProfile();
  const navigate = useNavigate();
  const [confirmShutdown, setConfirmShutdown] = useState(false);
  const [stopped, setStopped] = useState(false);
  const shutdown = useMutation({ mutationFn: endpoints.shutdown, onSuccess: () => setStopped(true) });

  const name = profile?.name ?? '';
  const avatar = profile?.avatar || name.charAt(0).toUpperCase() || '?';

  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          aria-label="Menu tài khoản"
          className="pressable focus-ring group flex items-center gap-2 rounded-full bg-surface/80 py-1 pr-2.5 pl-1.5 text-text card-edge transition-colors duration-(--duration-fast) hover:bg-surface cursor-pointer"
        >
          <span
            aria-hidden="true"
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent-text"
          >
            {avatar}
          </span>
          <span className="max-w-[120px] truncate text-sm font-semibold text-text">{name || 'Hồ sơ'}</span>
          <Icon name="chevron-right" size={14} strokeWidth={2.4} className="rotate-90 text-text-3 opacity-70 transition-opacity group-hover:opacity-100" />
        </Menu.Trigger>

        <Menu.Portal>
          <Menu.Positioner side="bottom" align="end" sideOffset={8} className="z-50">
            <Menu.Popup
              style={{ transformOrigin: 'var(--transform-origin)' }}
              className="min-w-[240px] rounded-2xl bg-surface/95 p-1.5 text-text shadow-[var(--shadow-sheet)] backdrop-blur-2xl card-edge outline-none transition-[opacity,scale,transform] duration-(--duration-fast) ease-[var(--ease-out)] data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0"
            >
              {/* Thẻ thông tin hồ sơ */}
              <div className="mb-1 flex items-center gap-3 rounded-xl bg-fill/40 px-3 py-2.5">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xl font-semibold text-accent-text shadow-sm">
                  {avatar}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-text" title={name || undefined}>{name || 'Hồ sơ'}</p>
                  <p className="text-xs text-text-3">
                    {profile?.dailyMinutes ? `${profile.dailyMinutes} phút mỗi ngày` : 'Hồ sơ đang dùng'}
                  </p>
                </div>
              </div>

              {/* Điều hướng nhanh */}
              <Menu.Item
                onClick={() => navigate('/settings')}
                className="pressable flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-text outline-none transition-colors hover:bg-fill focus-visible:bg-fill"
              >
                <Icon name="settings" size={16} strokeWidth={2} className="text-text-2" />
                <span>Cài đặt & Cá nhân</span>
              </Menu.Item>
              <Menu.Item
                onClick={() => navigate('/stats')}
                className="pressable flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-text outline-none transition-colors hover:bg-fill focus-visible:bg-fill"
              >
                <Icon name="chart" size={16} strokeWidth={2} className="text-text-2" />
                <span>Tiến độ học tập</span>
              </Menu.Item>
              <Menu.Item
                onClick={() => navigate('/words')}
                className="pressable flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-text outline-none transition-colors hover:bg-fill focus-visible:bg-fill"
              >
                <Icon name="book" size={16} strokeWidth={2} className="text-text-2" />
                <span>Kho từ vựng</span>
              </Menu.Item>

              <div className="my-1 h-px bg-separator" role="separator" />

              {/* Đổi hồ sơ */}
              <Menu.Item
                onClick={() => navigate('/profiles?manual=1')}
                className="pressable flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-text outline-none transition-colors hover:bg-fill focus-visible:bg-fill"
              >
                <Icon name="person" size={16} strokeWidth={2} className="text-text-2" />
                <span>Đổi hồ sơ học</span>
              </Menu.Item>

              <div className="my-1 h-px bg-separator" role="separator" />

              {/* Tắt ứng dụng */}
              <Menu.Item
                onClick={() => setConfirmShutdown(true)}
                className="pressable flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-danger-text outline-none transition-colors hover:bg-danger/10 focus-visible:bg-danger/10"
              >
                <Icon name="power" size={16} strokeWidth={2.2} />
                <span>Tắt app</span>
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <ConfirmDialog
        open={confirmShutdown}
        onOpenChange={setConfirmShutdown}
        title="Tắt app?"
        description="Trang này sẽ ngừng hoạt động cho tới khi bạn mở lại app."
        confirmLabel="Tắt app"
        destructive
        onConfirm={() => shutdown.mutate()}
      />

      {stopped && createPortal(
        <div data-testid="app-stopped" className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-bg p-6 text-center">
          <span className="inline-flex size-16 items-center justify-center rounded-full bg-fill text-text-2">
            <Icon name="power" size={30} />
          </span>
          <p className="text-2xl font-bold text-text">App đã tắt. Bạn có thể đóng tab này.</p>
        </div>,
        document.body,
      )}
    </>
  );
}
