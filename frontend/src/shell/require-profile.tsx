import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import { ApiError } from '../api/api-error';
import { configureSpeech } from '../speech/speech';

export const CURRENT_PROFILE_KEY = ['profile', 'current'] as const;

/** Hồ sơ đang dùng; dùng chung cache với RequireProfile nên không gọi lại API. */
export function useCurrentProfile() {
  return useQuery({ queryKey: CURRENT_PROFILE_KEY, queryFn: endpoints.currentProfile, meta: { silent: true } });
}

export default function RequireProfile() {
  const { data: profile, error, isLoading, refetch } = useCurrentProfile();

  useEffect(() => {
    if (profile) configureSpeech({ voice: profile.voice, rate: profile.speechRate });
  }, [profile]);

  if (isLoading) return <p className="p-8 text-slate-500">Đang tải…</p>;
  if (error instanceof ApiError && error.code === 'PROFILE_REQUIRED') return <Navigate to="/profiles" replace />;
  if (error || !profile) {
    return (
      <div role="alert" className="mx-auto mt-16 max-w-md card text-center">
        <p>{error instanceof ApiError ? error.message : 'Không tải được dữ liệu.'}</p>
        <button type="button" className="btn btn-primary mt-4" onClick={() => refetch()}>Thử lại</button>
      </div>
    );
  }
  return <Outlet />;
}
