import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { THEME_STORAGE_KEY } from '@/config/theme';
import { controlMatchMedia } from '@test/match-media';

const DARK = '(prefers-color-scheme: dark)';

afterEach(() => {
  document.documentElement.removeAttribute('data-theme');
  localStorage.clear();
});

test('đang sáng (Tự động, hệ thống sáng): nút mặt trăng "Chuyển sang giao diện tối", bấm thì lưu Tối', async () => {
  const user = userEvent.setup();
  controlMatchMedia({ [DARK]: false });
  render(<ThemeToggle />);
  const button = screen.getByRole('button', { name: 'Chuyển sang giao diện tối' });
  expect(button.querySelector('[data-icon="moon"]')).not.toBeNull();
  await user.click(button);
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  const next = screen.getByRole('button', { name: 'Chuyển sang giao diện sáng' });
  expect(next.querySelector('[data-icon="sun"]')).not.toBeNull();
});

test('đổi theo giao diện ĐANG HIỂN THỊ: Tự động + hệ thống tối → bấm thì lưu Sáng', async () => {
  const user = userEvent.setup();
  controlMatchMedia({ [DARK]: true });
  render(<ThemeToggle />);
  await user.click(screen.getByRole('button', { name: 'Chuyển sang giao diện sáng' }));
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  expect(screen.getByRole('button', { name: 'Chuyển sang giao diện tối' })).toBeInTheDocument();
});

test('Tự động: hệ thống đổi sang tối lúc đang mở → nhãn nút đổi theo ngay', () => {
  const media = controlMatchMedia({ [DARK]: false });
  render(<ThemeToggle />);
  expect(screen.getByRole('button', { name: 'Chuyển sang giao diện tối' })).toBeInTheDocument();
  media.set(DARK, true);
  expect(screen.getByRole('button', { name: 'Chuyển sang giao diện sáng' })).toBeInTheDocument();
});

test('bộ nhớ bị chặn: bấm vẫn đổi giao diện, không vỡ', async () => {
  const user = userEvent.setup();
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('denied', 'SecurityError');
  });
  render(<ThemeToggle />);
  await user.click(screen.getByRole('button', { name: 'Chuyển sang giao diện tối' }));
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  expect(screen.getByRole('button', { name: 'Chuyển sang giao diện sáng' })).toBeInTheDocument();
});
