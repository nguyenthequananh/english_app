import { screen } from '@testing-library/react';
import { renderRoute } from '@test/render';
import { mockApi, mockNetworkDown, problem } from '@test/mock-api';
import { stubSpeech } from '@test/speech-stub';

const profile = { id: 1, name: 'Lan', avatar: '🦊', hasPin: false, dailyMinutes: 30, voice: null, speechRate: 1 };
const health = { app: 'ielts-app', status: 'UP', recoveredFrom: null, restoredFrom: null };
const summary = { streak: 0, dueCount: 0, currentUnit: null, finishedToday: false };

test('chưa chọn hồ sơ thì về trang chọn hồ sơ', async () => {
  stubSpeech();
  mockApi({
    'GET /profiles/current': () => problem(401, 'PROFILE_REQUIRED', 'Chưa chọn hồ sơ'),
    'GET /health': () => ({ body: health }),
    'GET /profiles': () => ({ body: [] }),
  });
  renderRoute('/');
  expect(await screen.findByTestId('page-profiles')).toBeInTheDocument();
});

test('có hồ sơ thì hiện điều hướng', async () => {
  stubSpeech();
  mockApi({
    'GET /profiles/current': () => ({ body: profile }),
    'GET /health': () => ({ body: health }),
    'GET /progress/summary': () => ({ body: summary }),
  });
  renderRoute('/');
  expect(await screen.findByTestId('app-shell')).toBeInTheDocument();
  for (const label of ['Hôm nay', 'Lộ trình', 'Tiến độ', 'Cá nhân']) {
    expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
  }
  expect(screen.getByRole('link', { name: 'Buổi học hôm nay' })).toBeInTheDocument();
});

test('DB vừa được tự khôi phục thì hiện cảnh báo', async () => {
  stubSpeech();
  mockApi({
    'GET /profiles/current': () => ({ body: profile }),
    'GET /health': () => ({ body: { ...health, recoveredFrom: 'ielts-20261005-090000-auto.db' } }),
    'GET /progress/summary': () => ({ body: summary }),
  });
  renderRoute('/');
  expect(await screen.findByText(/ielts-20261005-090000-auto.db/)).toBeInTheDocument();
});

test('máy không có giọng tiếng Anh thì hiện hướng dẫn cài giọng', async () => {
  stubSpeech([{ name: 'Microsoft An', lang: 'vi-VN' }]);
  mockApi({
    'GET /profiles/current': () => ({ body: profile }),
    'GET /health': () => ({ body: health }),
    'GET /progress/summary': () => ({ body: summary }),
  });
  renderRoute('/');
  expect(await screen.findByText(/chưa có giọng đọc tiếng Anh/, {}, { timeout: 3000 })).toBeInTheDocument();
});

test('lỗi mạng thì hiện màn lỗi có nút thử lại', async () => {
  stubSpeech();
  mockNetworkDown();
  renderRoute('/');
  expect(await screen.findByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
});
