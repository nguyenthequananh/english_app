import { screen, waitFor } from '@testing-library/react';
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
  const name = await screen.findByLabelText('Tên hồ sơ');
  await user.clear(name);
  await user.type(name, 'Lan Anh');
  await user.click(screen.getByLabelText('Bỏ mã PIN'));
  await user.click(screen.getByRole('button', { name: 'Lưu hồ sơ' }));
  await screen.findByText('Đã lưu hồ sơ');
  expect(calls.find((c) => c.method === 'PUT')?.body).toMatchObject({ name: 'Lan Anh', removePin: true, dailyMinutes: 30, speechRate: 1 });
});

test('xoá hồ sơ sau khi xác nhận thì về trang chọn hồ sơ', async () => {
  const user = userEvent.setup();
  stubSpeech();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  const calls = mockApi({ ...base, 'DELETE /profiles/current': () => ({ status: 204 }) });
  renderSettings();
  await user.click(await screen.findByRole('button', { name: 'Xoá hồ sơ' }));
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
  expect(screen.getByText(/✓ unit-02.json/)).toBeInTheDocument();
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
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  mockApi({
    ...base,
    'POST /backups/ielts-20261006-090000-auto.db/restore': () => ({ body: { message: 'Đã lên lịch khôi phục. Hãy tắt app (nút Tắt app) rồi mở lại để hoàn tất.' } }),
    'POST /app/shutdown': () => ({ status: 202, body: { message: 'Đang tắt app...' } }),
  });
  renderSettings();
  await user.click(await screen.findByRole('button', { name: 'Khôi phục ielts-20261006-090000-auto.db' }));
  expect(await screen.findByText(/Đã lên lịch khôi phục/)).toBeInTheDocument();
  await user.click(screen.getAllByRole('button', { name: 'Tắt app' })[0]);
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
  const select = await screen.findByLabelText('Giọng đọc');
  await user.selectOptions(select, '');
  await user.click(screen.getByRole('button', { name: 'Lưu hồ sơ' }));
  await waitFor(() => expect(calls.some((c) => c.method === 'PUT')).toBe(true));
  expect(calls.find((c) => c.method === 'PUT')?.body).toHaveProperty('voice', '');
});
