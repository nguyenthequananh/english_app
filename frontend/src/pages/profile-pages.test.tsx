import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import ProfileSelectPage from './profile-select-page';
import CreateProfilePage from './create-profile-page';
import { renderAt } from '../test/render';
import { mockApi, problem } from '../test/mock-api';
import { stubSpeech } from '../test/speech-stub';

const lan = { id: 1, name: 'Lan', avatar: '🦊', hasPin: false, dailyMinutes: 30, voice: null, speechRate: 1 };
const minh = { id: 2, name: 'Minh', avatar: '🐼', hasPin: true, dailyMinutes: 30, voice: null, speechRate: 1 };

function renderPages(route: string) {
  renderAt(
    <Routes>
      <Route path="/" element={<p>TRANG CHỦ</p>} />
      <Route path="/profiles" element={<ProfileSelectPage />} />
      <Route path="/profiles/new" element={<CreateProfilePage />} />
    </Routes>,
    route,
  );
}

test('chưa có hồ sơ nào thì sang trang tạo hồ sơ', async () => {
  stubSpeech();
  mockApi({ 'GET /profiles': () => ({ body: [] }) });
  renderPages('/profiles');
  expect(await screen.findByLabelText('Tên')).toBeInTheDocument();
});

test('một hồ sơ không PIN thì tự vào luôn', async () => {
  const calls = mockApi({ 'GET /profiles': () => ({ body: [lan] }), 'POST /profiles/1/select': () => ({ status: 204 }) });
  renderPages('/profiles');
  expect(await screen.findByText('TRANG CHỦ')).toBeInTheDocument();
  expect(calls.some((c) => c.method === 'POST' && c.path === '/profiles/1/select')).toBe(true);
});

test('bấm Đổi hồ sơ (?manual=1) thì không tự vào', async () => {
  const calls = mockApi({ 'GET /profiles': () => ({ body: [lan] }) });
  renderPages('/profiles?manual=1');
  expect(await screen.findByRole('button', { name: /Lan/ })).toBeInTheDocument();
  await new Promise((r) => setTimeout(r, 50));
  expect(calls.some((c) => c.method === 'POST')).toBe(false);
  expect(screen.queryByText('TRANG CHỦ')).not.toBeInTheDocument();
});

test('hồ sơ có PIN: sai PIN báo lỗi, đúng PIN thì vào', async () => {
  const user = userEvent.setup();
  mockApi({
    'GET /profiles': () => ({ body: [lan, minh] }),
    'POST /profiles/2/select': (body) => ((body as { pin: string }).pin === '1234'
      ? { status: 204 } : problem(403, 'PIN_INVALID', 'Mã PIN không đúng')),
  });
  renderPages('/profiles');
  await user.click(await screen.findByRole('button', { name: /Minh/ }));
  await user.type(screen.getByLabelText('Mã PIN'), '9999');
  await user.click(screen.getByRole('button', { name: 'Vào' }));
  expect(await screen.findByText('Mã PIN không đúng')).toBeInTheDocument();
  await user.clear(screen.getByLabelText('Mã PIN'));
  await user.type(screen.getByLabelText('Mã PIN'), '1234');
  await user.click(screen.getByRole('button', { name: 'Vào' }));
  expect(await screen.findByText('TRANG CHỦ')).toBeInTheDocument();
});

test('tạo hồ sơ gửi đủ thông tin rồi chọn hồ sơ đó', async () => {
  const user = userEvent.setup();
  stubSpeech();
  const calls = mockApi({
    'POST /profiles': () => ({ status: 201, body: { ...lan, id: 7, name: 'Thành' } }),
    'POST /profiles/7/select': () => ({ status: 204 }),
  });
  renderPages('/profiles/new');
  await user.type(screen.getByLabelText('Tên'), 'Thành');
  await user.click(screen.getByRole('button', { name: 'Chọn avatar 🐯' }));
  await user.type(screen.getByLabelText('Mã PIN (không bắt buộc)'), '4321');
  await user.click(screen.getByRole('button', { name: 'Tạo hồ sơ' }));
  expect(await screen.findByText('TRANG CHỦ')).toBeInTheDocument();
  const created = calls.find((c) => c.method === 'POST' && c.path === '/profiles');
  expect(created?.body).toMatchObject({ name: 'Thành', avatar: '🐯', pin: '4321', dailyMinutes: 30 });
});

test('tạo hồ sơ xong mà chọn lỗi thì thử lại không tạo trùng', async () => {
  const user = userEvent.setup();
  stubSpeech();
  let selects = 0;
  const calls = mockApi({
    'POST /profiles': () => ({ status: 201, body: { ...lan, id: 7, name: 'Thành' } }),
    'POST /profiles/7/select': () => (++selects === 1 ? problem(500, 'INTERNAL', 'x') : { status: 204 }),
  });
  renderPages('/profiles/new');
  await user.type(screen.getByLabelText('Tên'), 'Thành');
  await user.click(screen.getByRole('button', { name: 'Tạo hồ sơ' }));
  await vi.waitFor(() => expect(selects).toBe(1));
  await user.click(await screen.findByRole('button', { name: 'Tạo hồ sơ' }));
  expect(await screen.findByText('TRANG CHỦ')).toBeInTheDocument();
  expect(calls.filter((c) => c.method === 'POST' && c.path === '/profiles')).toHaveLength(1);
});
