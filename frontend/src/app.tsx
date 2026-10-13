import { RouterProvider } from 'react-router';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { setProfileRequiredHandler } from './config/interceptors';
import { Toaster } from './components/toaster';
import type { createAppRouter } from './router';

type AppRouter = ReturnType<typeof createAppRouter>;

const KEEP_ON_LOGOUT = ['profiles', 'health'];

/**
 * Đăng ký xử lý PROFILE_REQUIRED: xoá cache (trừ hồ sơ, sức khoẻ) rồi về /profiles.
 * Gọi đồng bộ ngay sau khi tạo router + queryClient (trong main.tsx), trước lần render đầu,
 * để request đầu tiên đã có handler — không đợi effect.
 */
export function registerProfileRequiredHandler(router: Pick<AppRouter, 'navigate'>, queryClient: QueryClient) {
  setProfileRequiredHandler(() => {
    queryClient.removeQueries({ predicate: (q) => !KEEP_ON_LOGOUT.includes(String(q.queryKey[0])) });
    void router.navigate('/profiles', { replace: true });
  });
}

export default function App({ router, queryClient }: { router: AppRouter; queryClient: QueryClient }) {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  );
}
