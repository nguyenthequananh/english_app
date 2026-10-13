import type { ComponentType } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import RequireProfile from './shell/require-profile';
import AppShell from './shell/app-shell';
import FocusShell from './shell/focus-shell';
import RouteError from './shell/route-error';
import { CenteredPending, PagePending } from './shell/route-pending';
import TodayPage from './pages/today-page';

/**
 * Mỗi trang là một chunk riêng, tải khi vào route lần đầu (route `lazy` của React Router).
 * Trong lúc tải: lần đầu mở app thì hiện `hydrateFallbackElement` (khung giữ chỗ, shell vẫn có nav);
 * chuyển trang sau đó thì router giữ nguyên màn cũ tới khi chunk mới sẵn sàng — không chớp trắng.
 * Hôm nay (`/`) nạp sẵn: là màn mở app thường gặp nhất. Đã đo: tải lười Hôm nay không bớt byte nào cho `/`
 * (shell, bộ UI, motion đã nằm trong chunk đầu; Hôm nay còn import SessionPage để lấy SESSION_KEY) mà thêm
 * một vòng chờ chunk trước khi vẽ được màn đầu.
 */
const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({ Component: (await load()).default });

export const routes: RouteObject[] = [
  {
    path: '/profiles',
    lazy: page(() => import('./pages/profile-select-page')),
    hydrateFallbackElement: <CenteredPending />,
    errorElement: <RouteError />,
  },
  {
    path: '/profiles/new',
    lazy: page(() => import('./pages/create-profile-page')),
    hydrateFallbackElement: <CenteredPending />,
    errorElement: <RouteError />,
  },
  {
    element: <RequireProfile />,
    // Lỗi của chính shell (không phải của trang) — thay cả màn.
    errorElement: <RouteError />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            // Route con không đường dẫn chỉ để bắt lỗi/chờ tải BÊN TRONG AppShell: lỗi của một trang hiện
            // trong vùng nội dung, nav vẫn còn (errorElement đặt thẳng ở route AppShell sẽ thay cả khung).
            errorElement: <RouteError variant="app" />,
            hydrateFallbackElement: <PagePending />,
            children: [
              { index: true, element: <TodayPage /> },
              { path: 'roadmap', lazy: page(() => import('./pages/roadmap-page')) },
              { path: 'words', lazy: page(() => import('./pages/word-bank-page')) },
              { path: 'ipa', lazy: page(() => import('./pages/ipa-page')) },
              { path: 'stats', lazy: page(() => import('./pages/stats-page')) },
              { path: 'settings', lazy: page(() => import('./pages/settings-page')) },
            ],
          },
        ],
      },
      {
        element: <FocusShell />,
        children: [
          {
            errorElement: <RouteError variant="focus" />,
            hydrateFallbackElement: <PagePending />,
            children: [
              { path: 'session', lazy: page(() => import('./pages/session-page')) },
              { path: 'review', lazy: page(() => import('./pages/review-page')) },
              { path: 'lessons/:code', lazy: page(() => import('./pages/lesson-page')) },
              {
                path: 'units/:code/test',
                lazy: async () => {
                  const { default: TestPage } = await import('./pages/test-page');
                  return { element: <TestPage kind="UNIT" /> };
                },
              },
              {
                path: 'stages/:code/test',
                lazy: async () => {
                  const { default: TestPage } = await import('./pages/test-page');
                  return { element: <TestPage kind="STAGE" /> };
                },
              },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
