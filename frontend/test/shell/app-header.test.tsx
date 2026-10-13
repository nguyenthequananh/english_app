import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppHeader } from '@/shell/app-header';
import { renderAt } from '@test/render';
import { mockApi } from '@test/mock-api';

const profile = { id: 1, name: 'Lan', avatar: '🦊', hasPin: false, dailyMinutes: 30, voice: null, speechRate: 1 };
const summary = { streak: 5, dueCount: 10, finishedToday: false, currentUnit: null };

test('AppHeader hiện đúng tên trang, chuỗi ngày và nút mở UserMenu', async () => {
  mockApi({
    'GET /profiles/current': () => ({ body: profile }),
    'GET /progress/summary': () => ({ body: summary }),
  });
  renderAt(<AppHeader />, '/stats');

  expect(screen.getByText('Tiến độ')).toBeInTheDocument();
  expect(await screen.findByText('5 ngày')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Menu tài khoản' })).toBeInTheDocument();
  expect(screen.getByText('Lan')).toBeInTheDocument();
});

test('UserMenu mở dropdown khi click, chứa đầy đủ các mục hành động kiểu macOS', async () => {
  const user = userEvent.setup();
  mockApi({
    'GET /profiles/current': () => ({ body: profile }),
    'GET /progress/summary': () => ({ body: summary }),
  });
  renderAt(<AppHeader />, '/');

  const trigger = screen.getByRole('button', { name: 'Menu tài khoản' });
  await user.click(trigger);

  // Menu popup xuất hiện với đầy đủ tuỳ chọn
  expect(await screen.findByRole('menu')).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: /Cài đặt & Cá nhân/ })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: /Tiến độ học tập/ })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: /Kho từ vựng/ })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: /Đổi hồ sơ học/ })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: /Tắt app/ })).toBeInTheDocument();
});
