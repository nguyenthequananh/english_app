import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShutdownButton } from '@/components/shutdown-button';
import { renderAt } from '@test/render';
import { mockApi } from '@test/mock-api';

test('bấm Tắt app mở hộp xác nhận; xác nhận thì gọi POST /app/shutdown', async () => {
  const user = userEvent.setup();
  const calls = mockApi({ 'POST /app/shutdown': () => ({ status: 202, body: { message: 'Đang tắt app...' } }) });
  renderAt(<ShutdownButton />);
  await user.click(screen.getByRole('button', { name: 'Tắt app' }));
  const dialog = await screen.findByRole('alertdialog', { name: 'Tắt app?' });
  expect(dialog).toHaveTextContent('Trang này sẽ ngừng hoạt động cho tới khi bạn mở lại app.');
  expect(calls).toHaveLength(0);
  await user.click(within(dialog).getByRole('button', { name: 'Tắt app' }));
  expect(await screen.findByTestId('app-stopped')).toHaveTextContent('App đã tắt');
  expect(calls.filter((c) => c.method === 'POST' && c.path === '/app/shutdown')).toHaveLength(1);
});

test('huỷ thì không tắt app', async () => {
  const user = userEvent.setup();
  const calls = mockApi({});
  renderAt(<ShutdownButton />);
  await user.click(screen.getByRole('button', { name: 'Tắt app' }));
  const dialog = await screen.findByRole('alertdialog');
  await user.click(within(dialog).getByRole('button', { name: 'Huỷ' }));
  expect(calls).toHaveLength(0);
  expect(screen.queryByTestId('app-stopped')).not.toBeInTheDocument();
});
