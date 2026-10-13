import { screen } from '@testing-library/react';
import App from './app';
import { renderAt } from './test/render';
import { mockApi } from './test/mock-api';
import { stubSpeech } from './test/speech-stub';

test('route /profiles hiển thị trang chọn hồ sơ', () => {
  renderAt(<App />, '/profiles');
  expect(screen.getByTestId('page-profiles')).toBeInTheDocument();
});

test('route lạ quay về trang chủ', async () => {
  stubSpeech();
  mockApi({
    'GET /profiles/current': () => ({ body: { id: 1, name: 'Lan', avatar: null, hasPin: false, dailyMinutes: 30, voice: null, speechRate: 1 } }),
    'GET /health': () => ({ body: { app: 'ielts-app', status: 'UP', recoveredFrom: null, restoredFrom: null } }),
  });
  renderAt(<App />, '/khong-co');
  expect(await screen.findByTestId('layout')).toBeInTheDocument();
});
