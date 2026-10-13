import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';
import { useMediaQuery } from '../components/ui/use-media-query';

/*
 * Chế độ sáng/tối — theo máy (localStorage của trình duyệt), không theo hồ sơ.
 *
 * Nguồn sự thật lúc chạy là thuộc tính `data-theme` trên <html>: script nội tuyến đầu `index.html` đặt nó trước
 * khi vẽ (chống nháy), `setThemePreference` đổi nó, CSS (`@custom-variant dark` trong tokens.css) đọc nó.
 * Không có thuộc tính = Tự động (theo `prefers-color-scheme`). Script trong index.html lặp lại `applyTheme` bằng
 * JS thuần — đổi khoá lưu, tên thuộc tính hay màu `theme-color` thì sửa cả hai (test/config/theme.test.tsx canh).
 */

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'ielts-theme';
/** Màu thanh trạng thái / thanh trình duyệt = `--bg-base` của từng chế độ (màu ở đỉnh trang). */
export const THEME_COLORS: Record<ResolvedTheme, string> = { light: '#F4F6FB', dark: '#0B0E17' };
export const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function isExplicit(v: unknown): v is ResolvedTheme {
  return v === 'light' || v === 'dark';
}

/** Lựa chọn đã lưu. Bộ nhớ bị chặn (chế độ riêng tư, chính sách trình duyệt) hay giá trị lạ → Tự động. */
export function readStoredPreference(storage: Pick<Storage, 'getItem'> | undefined = safeLocalStorage()): ThemePreference {
  try {
    const v = storage?.getItem(THEME_STORAGE_KEY);
    return isExplicit(v) ? v : 'system';
  } catch {
    return 'system';
  }
}

function writeStoredPreference(pref: ThemePreference) {
  try {
    const storage = safeLocalStorage();
    if (pref === 'system') storage?.removeItem(THEME_STORAGE_KEY);
    else storage?.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    // Không lưu được thì vẫn đổi cho phiên này (thuộc tính trên <html> giữ lựa chọn).
  }
}

/** Chính việc chạm vào `window.localStorage` cũng có thể ném (Safari chặn cookie, iframe sandbox). */
function safeLocalStorage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

export function resolveTheme(pref: ThemePreference, systemDark: boolean): ResolvedTheme {
  return pref === 'system' ? (systemDark ? 'dark' : 'light') : pref;
}

/** Lựa chọn đang áp, đọc từ `data-theme` trên <html>. */
export function currentPreference(doc: Document = document): ThemePreference {
  const v = doc.documentElement.getAttribute('data-theme');
  return isExplicit(v) ? v : 'system';
}

/**
 * Áp lựa chọn lên trang: `data-theme` trên <html> (Tự động thì gỡ thuộc tính), `<meta name="color-scheme">`
 * (nền trình duyệt trước khi CSS tải) và `<meta name="theme-color">`.
 * Hai thẻ theme-color khai theo `media` cho hệ thống sáng/tối: ở Tự động mỗi thẻ giữ màu của chế độ nó khai,
 * ở Sáng/Tối cả hai cùng mang màu đã chọn — thẻ nào khớp media cũng ra đúng màu.
 */
export function applyTheme(pref: ThemePreference, doc: Document = document) {
  const root = doc.documentElement;
  if (pref === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', pref);
  doc.querySelector('meta[name="color-scheme"]')?.setAttribute('content', pref === 'system' ? 'light dark' : pref);
  doc.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    const own: ResolvedTheme = meta.getAttribute('media')?.includes('dark') ? 'dark' : 'light';
    meta.setAttribute('content', THEME_COLORS[pref === 'system' ? own : pref]);
  });
}

/* ---------- Kho nhỏ cho React: đổi lựa chọn → báo mọi nơi đang dùng useTheme ---------- */

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

/** Tab khác của app đổi chế độ → tab này theo luôn. */
function onStorage(e: StorageEvent) {
  if (e.key !== THEME_STORAGE_KEY && e.key !== null) return;
  const next = readStoredPreference();
  if (next === currentPreference()) return;
  applyTheme(next);
  notify();
}

function subscribe(onChange: () => void) {
  if (listeners.size === 0) window.addEventListener('storage', onStorage);
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) window.removeEventListener('storage', onStorage);
  };
}

function matches(query: string): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
}

/**
 * Đổi lựa chọn: lưu, áp lên <html>, báo React. Đổi bằng cross-fade ngắn của View Transitions (cả trang mờ chéo
 * một lần, ~200ms — xem `::view-transition-*` trong index.css) thay vì để từng màu tự chuyển; trình duyệt chưa có
 * View Transitions hoặc người dùng xin giảm chuyển động thì đổi tức thì.
 */
export function setThemePreference(next: ThemePreference) {
  writeStoredPreference(next);
  if (next === currentPreference()) return;
  const commit = () => {
    const root = document.documentElement;
    // Tắt mọi `transition` trong một khung hình để nút/thanh không tự chuyển màu lệch nhịp với cross-fade.
    root.classList.add('theme-switching');
    applyTheme(next);
    // Cập nhật React ngay trong callback để ảnh "sau" của cross-fade đã có icon/nhãn mới.
    flushSync(notify);
    void getComputedStyle(root).color;
    requestAnimationFrame(() => root.classList.remove('theme-switching'));
  };
  if (typeof document.startViewTransition === 'function' && !matches(REDUCED_MOTION_QUERY)) {
    document.startViewTransition(commit);
  } else {
    commit();
  }
}

/** Lựa chọn (`preference`), giao diện đang hiển thị (`resolved`) và hàm đổi. Ở Tự động, đổi theo hệ thống ngay. */
export function useTheme(): { preference: ThemePreference; resolved: ResolvedTheme; setPreference: (p: ThemePreference) => void } {
  const preference = useSyncExternalStore(subscribe, () => currentPreference(), () => 'system' as const);
  const systemDark = useMediaQuery(DARK_SCHEME_QUERY);
  return { preference, resolved: resolveTheme(preference, systemDark), setPreference: setThemePreference };
}
