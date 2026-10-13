import { useEffect } from 'react';
import { Link, Navigate, NavLink, Outlet } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import { ApiError } from '../api/api-error';
import { configureSpeech } from '../speech/speech';
import { HealthBanner } from './health-banner';
import { VoiceBanner } from './voice-banner';

const NAV = [
  { to: '/', label: 'Hôm nay' },
  { to: '/roadmap', label: 'Lộ trình' },
  { to: '/words', label: 'Kho từ' },
  { to: '/ipa', label: 'Phát âm' },
  { to: '/stats', label: 'Thống kê' },
  { to: '/settings', label: 'Cài đặt' },
];

export default function Layout() {
  const { data: profile, error, isLoading, refetch } = useQuery({
    queryKey: ['profile', 'current'],
    queryFn: endpoints.currentProfile,
    meta: { silent: true },
  });

  useEffect(() => {
    if (profile) configureSpeech({ voice: profile.voice, rate: profile.speechRate });
  }, [profile]);

  if (isLoading) return <p className="p-8 text-slate-500">Đang tải…</p>;
  if (error instanceof ApiError && error.code === 'PROFILE_REQUIRED') return <Navigate to="/profiles" replace />;
  if (error || !profile) {
    return (
      <div className="mx-auto mt-16 max-w-md card text-center">
        <p>{error instanceof ApiError ? error.message : 'Không tải được dữ liệu.'}</p>
        <button type="button" className="btn btn-primary mt-4" onClick={() => refetch()}>Thử lại</button>
      </div>
    );
  }

  return (
    <div data-testid="layout" className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-1 px-4 py-2">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}
              className={({ isActive }) => `rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'}`}>
              {n.label}
            </NavLink>
          ))}
          <span className="ml-auto text-sm">{profile.avatar} {profile.name}</span>
          <Link to="/profiles?manual=1" className="text-sm text-indigo-600 hover:underline">Đổi hồ sơ</Link>
        </nav>
      </header>
      <HealthBanner />
      <VoiceBanner />
      <main className="mx-auto max-w-5xl p-4">
        <Outlet />
      </main>
    </div>
  );
}
