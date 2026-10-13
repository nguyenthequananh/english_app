import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import Layout from '@/components/layout';
import { renderAt } from '@test/render';
import { mockApi, problem } from '@test/mock-api';
import { stubSpeech } from '@test/speech-stub';

const profile = { id: 1, name: 'Lan', avatar: '🦊', hasPin: false, dailyMinutes: 30, voice: null, speechRate: 1 };
const health = { app: 'ielts-app', status: 'UP', recoveredFrom: null, restoredFrom: null };

function renderLayout() {
  renderAt(
    <Routes>
      <Route path="/profiles" element={<p>TRANG CHỌN HỒ SƠ</p>} />
      <Route element={<Layout />}>
        <Route index element={<p>NỘI DUNG</p>} />
      </Route>
    </Routes>,
  );
}

test('chưa chọn hồ sơ thì về trang chọn hồ sơ', async () => {
  stubSpeech();
  mockApi({ 'GET /profiles/current': () => problem(401, 'PROFILE_REQUIRED', 'Chưa chọn hồ sơ'), 'GET /health': () => ({ body: health }) });
  renderLayout();
  expect(await screen.findByText('TRANG CHỌN HỒ SƠ')).toBeInTheDocument();
});

test('có hồ sơ thì hiện tên, thanh điều hướng và nội dung', async () => {
  stubSpeech();
  mockApi({ 'GET /profiles/current': () => ({ body: profile }), 'GET /health': () => ({ body: health }) });
  renderLayout();
  expect(await screen.findByText('NỘI DUNG')).toBeInTheDocument();
  expect(screen.getByText(/Lan/)).toBeInTheDocument();
  for (const label of ['Hôm nay', 'Lộ trình', 'Kho từ', 'Phát âm', 'Thống kê', 'Cài đặt']) {
    expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
  }
});

test('DB vừa được tự khôi phục thì hiện cảnh báo', async () => {
  stubSpeech();
  mockApi({
    'GET /profiles/current': () => ({ body: profile }),
    'GET /health': () => ({ body: { ...health, recoveredFrom: 'ielts-20261005-090000-auto.db' } }),
  });
  renderLayout();
  expect(await screen.findByText(/ielts-20261005-090000-auto.db/)).toBeInTheDocument();
});

test('máy không có giọng tiếng Anh thì hiện hướng dẫn cài giọng', async () => {
  stubSpeech([{ name: 'Microsoft An', lang: 'vi-VN' }]);
  mockApi({ 'GET /profiles/current': () => ({ body: profile }), 'GET /health': () => ({ body: health }) });
  renderLayout();
  expect(await screen.findByText(/chưa có giọng đọc tiếng Anh/, {}, { timeout: 3000 })).toBeInTheDocument();
});

test('lỗi mạng thì hiện màn lỗi có nút thử lại', async () => {
  stubSpeech();
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
  renderLayout();
  expect(await screen.findByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
});
