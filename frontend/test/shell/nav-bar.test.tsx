import { screen } from '@testing-library/react';
import { NavBar } from '@/shell/nav-bar';
import { renderAt } from '@test/render';
import { mockApi } from '@test/mock-api';

const profile = { id: 1, name: 'Lan', avatar: '🦊', hasPin: false, dailyMinutes: 30, voice: null, speechRate: 1 };

test('đánh dấu đúng mục đang mở', () => {
  mockApi({ 'GET /profiles/current': () => ({ body: profile }) });
  renderAt(<NavBar />, '/stats');
  expect(screen.getByRole('link', { name: 'Tiến độ' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: 'Hôm nay' })).not.toHaveAttribute('aria-current');
});

test('trang chủ chỉ active ở đúng "/"', () => {
  mockApi({ 'GET /profiles/current': () => ({ body: profile }) });
  renderAt(<NavBar />, '/');
  expect(screen.getByRole('link', { name: 'Hôm nay' })).toHaveAttribute('aria-current', 'page');
});

test('nút giữa dẫn tới buổi học hôm nay', () => {
  mockApi({ 'GET /profiles/current': () => ({ body: profile }) });
  renderAt(<NavBar />, '/');
  expect(screen.getByRole('link', { name: 'Buổi học hôm nay' })).toHaveAttribute('href', '/session');
});

test('chỉ một <nav>; thẻ hồ sơ có tên hồ sơ và link Đổi hồ sơ', async () => {
  mockApi({ 'GET /profiles/current': () => ({ body: profile }) });
  renderAt(<NavBar />, '/');
  expect(screen.getAllByRole('navigation')).toHaveLength(1);
  expect(await screen.findByText('Lan')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Đổi hồ sơ' })).toHaveAttribute('href', '/profiles?manual=1');
});

test('nút giữa đứng trước "Hôm nay" trong DOM — thứ tự Tab khớp thứ tự nhìn của sidebar', () => {
  mockApi({ 'GET /profiles/current': () => ({ body: profile }) });
  renderAt(<NavBar />, '/');
  const center = screen.getByRole('link', { name: 'Buổi học hôm nay' });
  const home = screen.getByRole('link', { name: 'Hôm nay' });
  expect(center.compareDocumentPosition(home) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  // Nút giữa không nằm trong danh sách: danh sách chỉ có 4 mục điều hướng.
  expect(screen.getAllByRole('listitem')).toHaveLength(4);
});
