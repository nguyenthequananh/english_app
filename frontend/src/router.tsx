import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import RequireProfile from './shell/require-profile';
import AppShell from './shell/app-shell';
import FocusShell from './shell/focus-shell';
import RouteError from './shell/route-error';
import ProfileSelectPage from './pages/profile-select-page';
import CreateProfilePage from './pages/create-profile-page';
import TodayPage from './pages/today-page';
import SessionPage from './pages/session-page';
import ReviewPage from './pages/review-page';
import LessonPage from './pages/lesson-page';
import TestPage from './pages/test-page';
import RoadmapPage from './pages/roadmap-page';
import WordBankPage from './pages/word-bank-page';
import IpaPage from './pages/ipa-page';
import StatsPage from './pages/stats-page';
import SettingsPage from './pages/settings-page';

export const routes: RouteObject[] = [
  { path: '/profiles', element: <ProfileSelectPage />, errorElement: <RouteError /> },
  { path: '/profiles/new', element: <CreateProfilePage />, errorElement: <RouteError /> },
  {
    element: <RequireProfile />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <TodayPage /> },
          { path: 'roadmap', element: <RoadmapPage /> },
          { path: 'words', element: <WordBankPage /> },
          { path: 'ipa', element: <IpaPage /> },
          { path: 'stats', element: <StatsPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
      {
        element: <FocusShell />,
        children: [
          { path: 'session', element: <SessionPage /> },
          { path: 'review', element: <ReviewPage /> },
          { path: 'lessons/:code', element: <LessonPage /> },
          { path: 'units/:code/test', element: <TestPage kind="UNIT" /> },
          { path: 'stages/:code/test', element: <TestPage kind="STAGE" /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
