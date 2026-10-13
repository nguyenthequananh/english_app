import { screen } from '@testing-library/react';
import { NavBar } from '@/shell/nav-bar';
import { renderAt } from '@test/render';

test('đánh dấu đúng mục đang mở', () => {
  renderAt(<NavBar />, '/stats');
  expect(screen.getByRole('link', { name: 'Tiến độ' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: 'Hôm nay' })).not.toHaveAttribute('aria-current');
});

test('trang chủ chỉ active ở đúng "/"', () => {
  renderAt(<NavBar />, '/');
  expect(screen.getByRole('link', { name: 'Hôm nay' })).toHaveAttribute('aria-current', 'page');
});

test('nút giữa dẫn tới buổi học hôm nay', () => {
  renderAt(<NavBar />, '/');
  expect(screen.getByRole('link', { name: 'Buổi học hôm nay' })).toHaveAttribute('href', '/session');
});
