import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, renderHook, waitFor } from '@testing-library/react';
import {
  applyTheme,
  readStoredPreference,
  setThemePreference,
  THEME_COLORS,
  THEME_STORAGE_KEY,
  useTheme,
} from '@/config/theme';
import { controlMatchMedia } from '@test/match-media';

const DARK = '(prefers-color-scheme: dark)';
const REDUCED = '(prefers-reduced-motion: reduce)';
const INDEX_HTML = readFileSync(resolve(__dirname, '../../index.html'), 'utf8');

/** Đưa <head> của index.html thật vào document của test (thẻ meta + script, script chưa chạy). */
function loadIndexHead() {
  const parsed = new DOMParser().parseFromString(INDEX_HTML, 'text/html');
  document.head.innerHTML = parsed.head.innerHTML;
}

/** Chạy đúng đoạn script chống nháy nội tuyến của index.html trên document hiện tại. */
function runInlineBootScript() {
  const script = [...document.head.querySelectorAll('script')].find((s) => !s.src && s.type !== 'module');
  expect(script, 'index.html phải có script nội tuyến chống nháy').toBeDefined();
  new Function(script!.textContent ?? '')();
}

const themeColors = () => [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')].map((m) => m.content);

beforeEach(() => loadIndexHead());

afterEach(() => {
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.classList.remove('theme-switching');
  localStorage.clear();
  document.head.innerHTML = '';
  delete (document as { startViewTransition?: unknown }).startViewTransition;
});

describe('lựa chọn đã lưu', () => {
  test('đọc light/dark; thiếu hoặc giá trị lạ → Tự động', () => {
    expect(readStoredPreference()).toBe('system');
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    expect(readStoredPreference()).toBe('dark');
    localStorage.setItem(THEME_STORAGE_KEY, 'sepia');
    expect(readStoredPreference()).toBe('system');
  });

  test('bộ nhớ ném lỗi (chế độ riêng tư) → Tự động, không vỡ', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    expect(readStoredPreference()).toBe('system');
  });
});

describe('applyTheme', () => {
  test('Sáng/Tối đặt data-theme, color-scheme và cả hai thẻ theme-color cùng màu đã chọn', () => {
    applyTheme('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(document.querySelector('meta[name="color-scheme"]')).toHaveAttribute('content', 'dark');
    expect(themeColors()).toEqual([THEME_COLORS.dark, THEME_COLORS.dark]);
    applyTheme('light');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(themeColors()).toEqual([THEME_COLORS.light, THEME_COLORS.light]);
  });

  test('Tự động gỡ data-theme và trả mỗi thẻ theme-color về màu của media nó khai', () => {
    applyTheme('dark');
    applyTheme('system');
    expect(document.documentElement).not.toHaveAttribute('data-theme');
    expect(document.querySelector('meta[name="color-scheme"]')).toHaveAttribute('content', 'light dark');
    expect(themeColors()).toEqual([THEME_COLORS.light, THEME_COLORS.dark]);
  });

  test('màu theme-color mặc định trong index.html khớp THEME_COLORS', () => {
    const metas = [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')];
    expect(metas.map((m) => [m.getAttribute('media'), m.content])).toEqual([
      ['(prefers-color-scheme: light)', THEME_COLORS.light],
      ['(prefers-color-scheme: dark)', THEME_COLORS.dark],
    ]);
  });
});

describe('script chống nháy trong index.html', () => {
  test.each(['light', 'dark'] as const)('lựa chọn đã lưu "%s" → áp y như applyTheme', (pref) => {
    localStorage.setItem(THEME_STORAGE_KEY, pref);
    runInlineBootScript();
    const fromScript = { attr: document.documentElement.getAttribute('data-theme'), colors: themeColors(), scheme: document.querySelector('meta[name="color-scheme"]')?.getAttribute('content') };
    loadIndexHead();
    document.documentElement.removeAttribute('data-theme');
    applyTheme(pref);
    expect(fromScript).toEqual({ attr: pref, colors: themeColors(), scheme: pref });
  });

  test('chưa lưu / giá trị lạ → không đụng gì (Tự động)', () => {
    runInlineBootScript();
    localStorage.setItem(THEME_STORAGE_KEY, 'sepia');
    runInlineBootScript();
    expect(document.documentElement).not.toHaveAttribute('data-theme');
    expect(themeColors()).toEqual([THEME_COLORS.light, THEME_COLORS.dark]);
  });

  test('bộ nhớ bị chặn → không ném lỗi', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    expect(() => runInlineBootScript()).not.toThrow();
    expect(document.documentElement).not.toHaveAttribute('data-theme');
  });

  test('dùng đúng khoá lưu của theme.ts', () => {
    expect(INDEX_HTML).toContain(`localStorage.getItem('${THEME_STORAGE_KEY}')`);
  });
});

describe('setThemePreference', () => {
  test('lưu lựa chọn và áp data-theme; Tự động xoá khoá lưu', () => {
    setThemePreference('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    setThemePreference('system');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(document.documentElement).not.toHaveAttribute('data-theme');
  });

  test('ghi bộ nhớ lỗi → vẫn đổi cho phiên này', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    expect(() => setThemePreference('dark')).not.toThrow();
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  test('có View Transitions → đổi trong một cross-fade; giảm chuyển động → đổi tức thì', async () => {
    const start = vi.fn((cb: () => void) => {
      cb();
      return {} as ViewTransition;
    });
    (document as { startViewTransition?: unknown }).startViewTransition = start;
    const media = controlMatchMedia();
    setThemePreference('dark');
    expect(start).toHaveBeenCalledTimes(1);
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    // Lớp tắt transition chỉ sống một khung hình.
    await waitFor(() => expect(document.documentElement).not.toHaveClass('theme-switching'));

    media.set(REDUCED, true);
    setThemePreference('light');
    expect(start).toHaveBeenCalledTimes(1);
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });
});

describe('useTheme', () => {
  test('Tự động theo hệ thống, và đổi ngay khi hệ thống đổi', () => {
    const media = controlMatchMedia({ [DARK]: false });
    const { result } = renderHook(() => useTheme());
    expect(result.current).toMatchObject({ preference: 'system', resolved: 'light' });
    media.set(DARK, true);
    expect(result.current.resolved).toBe('dark');
    media.set(DARK, false);
    expect(result.current.resolved).toBe('light');
  });

  test('lựa chọn Sáng/Tối thắng hệ thống', () => {
    const media = controlMatchMedia({ [DARK]: true });
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setPreference('light'));
    expect(result.current).toMatchObject({ preference: 'light', resolved: 'light' });
    media.set(DARK, false);
    act(() => result.current.setPreference('dark'));
    expect(result.current).toMatchObject({ preference: 'dark', resolved: 'dark' });
  });

  test('tab khác đổi chế độ (sự kiện storage) → tab này theo', () => {
    const { result } = renderHook(() => useTheme());
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: THEME_STORAGE_KEY, newValue: 'dark' }));
    });
    expect(result.current.preference).toBe('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });
});
