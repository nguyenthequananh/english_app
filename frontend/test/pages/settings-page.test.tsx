import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import SettingsPage from '@/pages/settings-page';
import { Toaster } from '@/components/toaster';
import { renderAt } from '@test/render';
import { mockApi } from '@test/mock-api';
import { stubSpeech } from '@test/speech-stub';

const profile = { id: 1, name: 'Lan', avatar: '🦊', hasPin: true, dailyMinutes: 30, voice: null, speechRate: 1 };
const base = {
  'GET /profiles/current': () => ({ body: profile }),
  'GET /backups': () => ({ body: [{ name: 'ielts-20261006-090000-auto.db', sizeBytes: 2048, createdAt: '2026-10-06T09:00' }] }),
  'GET /settings': () => ({ body: { appHome: 'C:\\Users\\PC\\.ielts-app', backupDir: 'C:\\Users\\PC\\.ielts-app\\backups', logDir: 'C:\\Users\\PC\\.ielts-app\\logs' } }),
};

function renderSettings() {
  renderAt(
    <>
      <Routes>
        <Route path="/profiles" element={<p>TRANG CHỌN HỒ SƠ</p>} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
      <Toaster />
    </>,
    '/settings',
  );
}

test('lưu hồ sơ gửi các trường đã sửa và bỏ PIN', async () => {
  const user = userEvent.setup();
  stubSpeech();
  const calls = mockApi({ ...base, 'PUT /profiles/current': (body) => ({ body: { ...profile, ...(body as object), hasPin: false } }) });
  renderSettings();
  await user.click(await screen.findByRole('button', { name: /Sửa hồ sơ/ }));
  const sheet = await screen.findByRole('dialog', { name: 'Sửa hồ sơ' });
  const name = within(sheet).getByLabelText('Tên hồ sơ');
  await user.clear(name);
  await user.type(name, 'Lan Anh');
  await user.click(within(sheet).getByRole('switch', { name: 'Bỏ mã PIN' }));
  await user.click(within(sheet).getByRole('button', { name: 'Lưu hồ sơ' }));
  await screen.findByText('Đã lưu hồ sơ');
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Sửa hồ sơ' })).not.toBeInTheDocument());
  expect(calls.find((c) => c.method === 'PUT')?.body).toMatchObject({ name: 'Lan Anh', removePin: true, dailyMinutes: 30, speechRate: 1 });
});

test('xoá hồ sơ sau khi xác nhận thì về trang chọn hồ sơ', async () => {
  const user = userEvent.setup();
  stubSpeech();
  const calls = mockApi({ ...base, 'DELETE /profiles/current': () => ({ status: 204 }) });
  renderSettings();
  await user.click(await screen.findByRole('button', { name: 'Xoá hồ sơ' }));
  const confirm = await screen.findByRole('alertdialog', { name: 'Xoá hồ sơ "Lan" và toàn bộ tiến độ?' });
  expect(calls.some((c) => c.method === 'DELETE')).toBe(false);
  await user.click(within(confirm).getByRole('button', { name: 'Xoá hồ sơ' }));
  expect(await screen.findByText('TRANG CHỌN HỒ SƠ')).toBeInTheDocument();
  expect(calls.some((c) => c.method === 'DELETE')).toBe(true);
});

test('nhập file nội dung hiện kết quả từng file', async () => {
  const user = userEvent.setup();
  stubSpeech();
  mockApi({ ...base, 'POST /content/import': () => ({ body: [
    { file: 'unit-02.json', ok: true, errors: [] },
    { file: 'unit-03.json', ok: false, errors: ['lessons[0].day: phải là MON..SAT'] },
  ] }) });
  renderSettings();
  const input = await screen.findByLabelText('Chọn file nội dung (.json)');
  await user.upload(input, [
    new File(['{}'], 'unit-02.json', { type: 'application/json' }),
    new File(['{}'], 'unit-03.json', { type: 'application/json' }),
  ]);
  expect(await screen.findByText('lessons[0].day: phải là MON..SAT')).toBeInTheDocument();
  expect(within(screen.getByText('unit-02.json').closest('li')!).getByText('Đã nhập')).toBeInTheDocument();
  expect(within(screen.getByText('unit-03.json').closest('li')!).getByText('Lỗi')).toBeInTheDocument();
});

test('nhập hồ sơ từ file JSON', async () => {
  const user = userEvent.setup();
  stubSpeech();
  const calls = mockApi({ ...base, 'POST /profiles/import': () => ({ status: 201, body: { profile: { ...profile, id: 2, name: 'Minh' }, skippedRows: 2 } }) });
  renderSettings();
  const input = await screen.findByLabelText('Nhập hồ sơ từ file');
  await user.upload(input, new File(['{"version":1,"profile":{"name":"Minh"}}'], 'ho-so.json', { type: 'application/json' }));
  expect(await screen.findByText(/Đã nhập hồ sơ "Minh"/)).toBeInTheDocument();
  expect(calls.find((c) => c.path === '/profiles/import')?.body).toEqual({ version: 1, profile: { name: 'Minh' } });
});

test('khôi phục bản sao lưu rồi tắt app', async () => {
  const user = userEvent.setup();
  stubSpeech();
  const calls = mockApi({
    ...base,
    'POST /backups/ielts-20261006-090000-auto.db/restore': () => ({ body: { message: 'Đã lên lịch khôi phục. Hãy tắt app (nút Tắt app) rồi mở lại để hoàn tất.' } }),
    'POST /app/shutdown': () => ({ status: 202, body: { message: 'Đang tắt app...' } }),
  });
  renderSettings();
  await user.click(await screen.findByRole('button', { name: 'Khôi phục ielts-20261006-090000-auto.db' }));
  const ask = await screen.findByRole('alertdialog', { name: 'Khôi phục dữ liệu về bản ielts-20261006-090000-auto.db?' });
  expect(calls.some((c) => c.path.endsWith('/restore'))).toBe(false);
  await user.click(within(ask).getByRole('button', { name: 'Khôi phục' }));
  expect(await screen.findByText(/Đã lên lịch khôi phục/)).toBeInTheDocument();
  await user.click(screen.getAllByRole('button', { name: 'Tắt app' })[0]);
  const confirm = await screen.findByRole('alertdialog', { name: 'Tắt app?' });
  await user.click(within(confirm).getByRole('button', { name: 'Tắt app' }));
  expect(await screen.findByTestId('app-stopped')).toHaveTextContent('App đã tắt');
});

test('chọn lại giọng tự động gửi voice rỗng', async () => {
  const user = userEvent.setup();
  stubSpeech();
  const withVoice = { ...profile, voice: 'Microsoft Ryan' };
  const calls = mockApi({
    ...base,
    'GET /profiles/current': () => ({ body: withVoice }),
    'PUT /profiles/current': (body) => ({ body: { ...withVoice, ...(body as object), voice: null } }),
  });
  renderSettings();
  const select = await screen.findByRole('combobox', { name: 'Giọng đọc' });
  expect(screen.getByRole('button', { name: 'Lưu giọng đọc' })).toBeDisabled();
  await user.selectOptions(select, '');
  await user.click(screen.getByRole('button', { name: 'Lưu giọng đọc' }));
  await waitFor(() => expect(calls.some((c) => c.method === 'PUT')).toBe(true));
  expect(calls.find((c) => c.method === 'PUT')?.body).toHaveProperty('voice', '');
});

test('huỷ ở hộp xác nhận thì không xoá hồ sơ', async () => {
  const user = userEvent.setup();
  stubSpeech();
  const calls = mockApi(base);
  renderSettings();
  await user.click(await screen.findByRole('button', { name: 'Xoá hồ sơ' }));
  const confirm = await screen.findByRole('alertdialog');
  await user.click(within(confirm).getByRole('button', { name: 'Huỷ' }));
  await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  expect(calls.some((c) => c.method === 'DELETE')).toBe(false);
  expect(screen.queryByText('TRANG CHỌN HỒ SƠ')).not.toBeInTheDocument();
});

test('thẻ hồ sơ có nút Đổi hồ sơ trỏ về trang chọn hồ sơ (không tự vào)', async () => {
  stubSpeech();
  mockApi(base);
  renderSettings();
  const page = await screen.findByTestId('page-settings');
  expect(await within(page).findByRole('link', { name: 'Đổi hồ sơ' })).toHaveAttribute('href', '/profiles?manual=1');
  expect(within(page).getByText('30 phút mỗi ngày · Có mã PIN')).toBeInTheDocument();
});

describe('Giao diện (sáng/tối)', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
  });

  test('Segmented "Giao diện" chọn được Tự động · Sáng · Tối, lưu theo máy', async () => {
    const user = userEvent.setup();
    stubSpeech();
    mockApi(base);
    renderSettings();
    const group = await screen.findByRole('radiogroup', { name: 'Giao diện' });
    expect(within(group).getByRole('radio', { name: 'Tự động' })).toHaveAttribute('aria-checked', 'true');

    await user.click(within(group).getByRole('radio', { name: 'Tối' }));
    expect(localStorage.getItem('ielts-theme')).toBe('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(within(group).getByRole('radio', { name: 'Tối' })).toHaveAttribute('aria-checked', 'true');

    await user.click(within(group).getByRole('radio', { name: 'Sáng' }));
    expect(localStorage.getItem('ielts-theme')).toBe('light');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');

    await user.click(within(group).getByRole('radio', { name: 'Tự động' }));
    expect(localStorage.getItem('ielts-theme')).toBeNull();
    expect(document.documentElement).not.toHaveAttribute('data-theme');
  });

  test('nút nhanh ở tiêu đề trang đổi giao diện và Segmented theo cùng', async () => {
    const user = userEvent.setup();
    stubSpeech();
    mockApi(base);
    renderSettings();
    const page = await screen.findByTestId('page-settings');
    await user.click(within(page).getByRole('button', { name: 'Chuyển sang giao diện tối' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(await within(page).findByRole('radio', { name: 'Tối' })).toHaveAttribute('aria-checked', 'true');
    expect(within(page).getByRole('button', { name: 'Chuyển sang giao diện sáng' })).toBeInTheDocument();
  });
});
