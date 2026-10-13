import { toast as sonner, Toaster as SonnerToaster } from 'sonner';
import type { CSSProperties } from 'react';
import { ApiError } from '../api/api-error';
import { Icon } from './ui/icons';
import { DESKTOP_QUERY, useMediaQuery } from './ui/use-media-query';
import { useTheme } from '../config/theme';

/** Hiện một thông báo ngắn. Giữ chữ ký cũ để nơi gọi không phải đổi. */
export function toast(message: string, kind: 'info' | 'error' = 'info') {
  if (kind === 'error') sonner.error(message);
  else sonner(message);
}

/** Thông báo lỗi chuẩn cho mọi query/mutation. Bỏ qua PROFILE_REQUIRED (đã có điều hướng về /profiles). */
export function notifyError(e: unknown) {
  if (e instanceof ApiError) {
    if (e.code !== 'PROFILE_REQUIRED') toast(e.message, 'error');
  } else {
    toast('Có lỗi không mong muốn', 'error');
  }
}

/* Sonner tự đọc các biến này; trỏ chúng về token để thông báo theo đúng sáng/tối của app. */
const TOAST_VARS = {
  '--normal-bg': 'var(--material-strong)',
  '--normal-border': 'var(--material-edge)',
  '--normal-text': 'var(--text)',
  '--border-radius': '18px',
} as CSSProperties;

/** Một Toaster duy nhất ở gốc app. Điện thoại: trên-giữa (không đè tab bar); màn rộng: dưới-phải. */
export function Toaster() {
  const desktop = useMediaQuery(DESKTOP_QUERY);
  // Theo giao diện đang hiển thị (kể cả khi người dùng ép Sáng/Tối), không theo hệ thống.
  const { resolved } = useTheme();
  return (
    <SonnerToaster
      theme={resolved}
      containerAriaLabel="Thông báo"
      position={desktop ? 'bottom-right' : 'top-center'}
      duration={6000}
      gap={10}
      mobileOffset={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)', left: 16, right: 16 }}
      style={TOAST_VARS}
      icons={{
        error: <span className="tone-danger inline-flex text-[var(--tone-text)]"><Icon name="cross" size={18} strokeWidth={2.4} /></span>,
        success: <span className="tone-success inline-flex text-[var(--tone-text)]"><Icon name="check" size={18} strokeWidth={2.4} /></span>,
      }}
      toastOptions={{
        classNames: {
          toast: 'app-toast',
          title: 'app-toast-title',
        },
      }}
    />
  );
}
