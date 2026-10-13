import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router';
import { setProfileRequiredHandler } from './config/interceptors';
import Layout from './components/layout';
import { Toaster } from './components/toaster';
import CreateProfilePage from './pages/create-profile-page';
import IpaPage from './pages/ipa-page';
import LessonPage from './pages/lesson-page';
import ProfileSelectPage from './pages/profile-select-page';
import ReviewPage from './pages/review-page';
import RoadmapPage from './pages/roadmap-page';
import SessionPage from './pages/session-page';
import SettingsPage from './pages/settings-page';
import StatsPage from './pages/stats-page';
import TestPage from './pages/test-page';
import TodayPage from './pages/today-page';
import WordBankPage from './pages/word-bank-page';

export default function App() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useEffect(() => {
    setProfileRequiredHandler(() => {
      queryClient.removeQueries({ predicate: (q) => !['profiles', 'health'].includes(String(q.queryKey[0])) });
      navigate('/profiles', { replace: true });
    });
  }, [navigate, queryClient]);

  return (
    <>
      <Routes>
        <Route path="/profiles" element={<ProfileSelectPage />} />
        <Route path="/profiles/new" element={<CreateProfilePage />} />
        <Route element={<Layout />}>
          <Route index element={<TodayPage />} />
          <Route path="session" element={<SessionPage />} />
          <Route path="review" element={<ReviewPage />} />
          <Route path="lessons/:code" element={<LessonPage />} />
          <Route path="units/:code/test" element={<TestPage kind="UNIT" />} />
          <Route path="stages/:code/test" element={<TestPage kind="STAGE" />} />
          <Route path="roadmap" element={<RoadmapPage />} />
          <Route path="words" element={<WordBankPage />} />
          <Route path="ipa" element={<IpaPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}
