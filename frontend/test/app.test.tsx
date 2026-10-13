import { screen, waitFor } from '@testing-library/react';
import { render } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import App, { registerProfileRequiredHandler } from '@/app';
import { api } from '@/api/client';
import { createQueryClient } from '@/config/query-client';
import { routes } from '@/router';
import { mockApi, problem } from '@test/mock-api';
import { stubSpeech } from '@test/speech-stub';

test('PROFILE_REQUIRED ở bất kỳ request nào đưa về /profiles', async () => {
  stubSpeech();
  mockApi({
    'GET /profiles/current': () => problem(401, 'PROFILE_REQUIRED', 'Chưa chọn hồ sơ'),
    'GET /profiles': () => ({ body: [] }),
    'GET /health': () => ({ body: { app: 'ielts-app', status: 'UP', recoveredFrom: null, restoredFrom: null } }),
  });
  const router = createMemoryRouter(routes, { initialEntries: ['/stats'] });
  const queryClient = createQueryClient();
  registerProfileRequiredHandler(router, queryClient);
  render(<App router={router} queryClient={queryClient} />);
  await waitFor(() => expect(router.state.location.pathname).toBe('/profiles'));
  expect(await screen.findByTestId('page-profiles')).toBeInTheDocument();
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
