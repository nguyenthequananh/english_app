import { screen } from '@testing-library/react';
import { renderRoute } from '@test/render';
import { mockApi } from '@test/mock-api';
import { stubSpeech } from '@test/speech-stub';

const profile = { id: 1, name: 'Lan', avatar: '🦊', hasPin: false, dailyMinutes: 30, voice: null, speechRate: 1 };
const health = { app: 'ielts-app', status: 'UP', recoveredFrom: null, restoredFrom: null };

function signedIn(extra: Record<string, () => { body?: unknown; status?: number }> = {}) {
  stubSpeech();
  mockApi({ 'GET /profiles/current': () => ({ body: profile }), 'GET /health': () => ({ body: health }), ...extra });
}

test('/profiles nằm ngoài khung app', () => {
  mockApi({ 'GET /profiles': () => ({ body: [] }) });
  renderRoute('/profiles');
  expect(screen.getByTestId('page-profiles')).toBeInTheDocument();
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
});

test.each(['/', '/roadmap', '/words', '/ipa', '/stats', '/settings'])('%s dùng AppShell có điều hướng', async (path) => {
  signedIn();
  renderRoute(path);
  expect(await screen.findByTestId('app-shell')).toBeInTheDocument();
  expect(screen.getAllByRole('navigation')).toHaveLength(1);
});

test.each(['/session', '/review', '/lessons/S0-U01-G1', '/units/S0-U01/test', '/stages/S0/test'])(
  '%s dùng FocusShell không có điều hướng', async (path) => {
    signedIn();
    renderRoute(path);
    expect(await screen.findByTestId('focus-shell')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

test('đường dẫn lạ quay về trang chủ', async () => {
  signedIn();
  const { router } = renderRoute('/khong-co');
  expect(await screen.findByTestId('app-shell')).toBeInTheDocument();
  expect(router.state.location.pathname).toBe('/');
});
