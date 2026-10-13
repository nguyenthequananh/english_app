import { screen, waitFor, within } from '@testing-library/react';
import { renderRoute } from '@test/render';
import { mockApi } from '@test/mock-api';
import { stubSpeech } from '@test/speech-stub';

const profile = { id: 1, name: 'Lan', avatar: '🦊', hasPin: false, dailyMinutes: 30, voice: null, speechRate: 1 };
const health = { app: 'ielts-app', status: 'UP', recoveredFrom: null, restoredFrom: null };

function signedIn(extra: Record<string, () => { body?: unknown; status?: number }> = {}) {
  stubSpeech();
  mockApi({ 'GET /profiles/current': () => ({ body: profile }), 'GET /health': () => ({ body: health }), ...extra });
}

test('/profiles nằm ngoài khung app', async () => {
  mockApi({ 'GET /profiles': () => ({ body: [] }) });
  renderRoute('/profiles');
  // Trang tải lười: đợi chunk về rồi mới có nội dung.
  expect(await screen.findByTestId('page-profiles')).toBeInTheDocument();
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
});

test.each([
  ['/', 'page-today'], ['/roadmap', 'page-roadmap'], ['/words', 'page-words'], ['/ipa', 'page-ipa'],
  ['/stats', 'page-stats'], ['/settings', 'page-settings'],
])('%s dùng AppShell có điều hướng', async (path, pageId) => {
  signedIn();
  renderRoute(path);
  // Shell nạp sẵn; trang tải lười hiện bên trong shell khi chunk về.
  const shell = await screen.findByTestId('app-shell');
  expect(await within(shell).findByTestId(pageId)).toBeInTheDocument();
  expect(screen.getAllByRole('navigation')).toHaveLength(1);
  expect(screen.queryByTestId('page-pending')).not.toBeInTheDocument();
});

test.each(['/session', '/review', '/lessons/S0-U01-G1', '/units/S0-U01/test', '/stages/S0/test'])(
  '%s dùng FocusShell không có điều hướng', async (path) => {
    signedIn();
    renderRoute(path);
    const shell = await screen.findByTestId('focus-shell');
    // Mỗi màn tập trung tự có TopBar: thấy TopBar nghĩa là chunk của trang đã về và đang render trong shell.
    await waitFor(() => expect(shell.querySelector('[data-top-bar]')).not.toBeNull());
    expect(screen.queryByTestId('page-pending')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

test('đường dẫn lạ quay về trang chủ', async () => {
  signedIn();
  const { router } = renderRoute('/khong-co');
  expect(await screen.findByTestId('app-shell')).toBeInTheDocument();
  expect(router.state.location.pathname).toBe('/');
});
