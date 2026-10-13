import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { setProfileRequiredHandler } from './config/interceptors';
import { Toaster } from './components/toaster';
import type { createAppRouter } from './router';

type AppRouter = ReturnType<typeof createAppRouter>;

const KEEP_ON_LOGOUT = ['profiles', 'health'];

export default function App({ router, queryClient }: { router: AppRouter; queryClient: QueryClient }) {
  useEffect(() => {
    setProfileRequiredHandler(() => {
      queryClient.removeQueries({ predicate: (q) => !KEEP_ON_LOGOUT.includes(String(q.queryKey[0])) });
      router.navigate('/profiles', { replace: true });
    });
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  );
}
