import { Navigate, Route, Routes } from 'react-router';
import Layout from './components/Layout';
import ProfileSelectPage from './pages/ProfileSelectPage';
import CreateProfilePage from './pages/CreateProfilePage';
import TodayPage from './pages/TodayPage';
import SessionPage from './pages/SessionPage';
import ReviewPage from './pages/ReviewPage';
import LessonPage from './pages/LessonPage';
import TestPage from './pages/TestPage';
import RoadmapPage from './pages/RoadmapPage';
import WordBankPage from './pages/WordBankPage';
import IpaPage from './pages/IpaPage';
import StatsPage from './pages/StatsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
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
  );
}
