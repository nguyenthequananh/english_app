import { screen, waitFor } from '@testing-library/react';
import { render } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import App, { registerProfileRequiredHandler } from '@/app';
import { api } from '@/api/client';
import { createQueryClient } from '@/config/query-client';
import { routes } from '@/router';
import { mockApi, problem } from '@test/mock-api';
import { stubSpeech } from '@test/speech-stub';

// Hai hồ sơ (một có PIN) → trang chọn hồ sơ đứng yên ở /profiles: không tự chọn (chỉ khi đúng 1 hồ sơ
// không PIN) và không chuyển sang /profiles/new (chỉ khi danh sách rỗng). Danh sách rỗng ở đây từng làm
// test chập chờn: /profiles chỉ là điểm dừng thoáng qua trước lần chuyển tiếp sang /profiles/new.
const profiles = [
  { id: 1, name: 'Lan', avatar: '🦊', hasPin: false, dailyMinutes: 30, voice: null, speechRate: 1 },
  { id: 2, name: 'Minh', avatar: '🐼', hasPin: true, dailyMinutes: 30, voice: null, speechRate: 1 },
];

test('PROFILE_REQUIRED ở bất kỳ request nào đưa về /profiles', async () => {
  stubSpeech();
  mockApi({
    'GET /profiles/current': () => problem(401, 'PROFILE_REQUIRED', 'Chưa chọn hồ sơ'),
    'GET /profiles': () => ({ body: profiles }),
    'GET /health': () => ({ body: { app: 'ielts-app', status: 'UP', recoveredFrom: null, restoredFrom: null } }),
  });
  const router = createMemoryRouter(routes, { initialEntries: ['/stats'] });
  const queryClient = createQueryClient();
  registerProfileRequiredHandler(router, queryClient);
  render(<App router={router} queryClient={queryClient} />);
  await waitFor(() => expect(router.state.location.pathname).toBe('/profiles'));
  // Đợi tới trạng thái cuối (danh sách hồ sơ đã tải) chứ không chỉ khung trang, rồi mới khẳng định.
  expect(await screen.findByRole('button', { name: /Minh/ })).toBeInTheDocument();
  expect(screen.getByTestId('page-profiles')).toBeInTheDocument();
  expect(router.state.location.pathname).toBe('/profiles');
});

test('handler PROFILE_REQUIRED xoá cache trừ hồ sơ và sức khoẻ', async () => {
  const router = createMemoryRouter(routes, { initialEntries: ['/stats'] });
  const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(undefined);
  const queryClient = createQueryClient();
  queryClient.setQueryData(['profiles'], []);
  queryClient.setQueryData(['health'], { status: 'UP' });
  queryClient.setQueryData(['stats', 'summary'], { streak: 3 });
  registerProfileRequiredHandler(router, queryClient);
  mockApi({ 'GET /progress/summary': () => problem(401, 'PROFILE_REQUIRED', 'Chưa chọn hồ sơ') });
  await expect(api.get('/progress/summary')).rejects.toMatchObject({ code: 'PROFILE_REQUIRED' });
  expect(navigate).toHaveBeenCalledWith('/profiles', { replace: true });
  expect(queryClient.getQueryData(['profiles'])).toEqual([]);
  expect(queryClient.getQueryData(['health'])).toEqual({ status: 'UP' });
  expect(queryClient.getQueryData(['stats', 'summary'])).toBeUndefined();
});
