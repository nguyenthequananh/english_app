import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import { ApiError } from '../api/api-error';
import { configureSpeech } from '../speech/speech';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Icon } from '../components/ui/icons';

export const CURRENT_PROFILE_KEY = ['profile', 'current'] as const;

/** Hồ sơ đang dùng; dùng chung cache với RequireProfile nên không gọi lại API. */
export function useCurrentProfile() {
  return useQuery({ queryKey: CURRENT_PROFILE_KEY, queryFn: endpoints.currentProfile, meta: { silent: true } });
}

export default function RequireProfile() {
  const { data: profile, error, isLoading, isFetching, refetch } = useCurrentProfile();

  useEffect(() => {
    if (profile) configureSpeech({ voice: profile.voice, rate: profile.speechRate });
  }, [profile]);

  if (isLoading) {
    return (
      <div role="status" className="flex min-h-dvh flex-col items-center justify-center gap-3 text-text-3">
        <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" className="animate-spin text-accent">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.2" />
          <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <p className="text-base">Đang tải…</p>
      </div>
    );
  }
  if (error instanceof ApiError && error.code === 'PROFILE_REQUIRED') return <Navigate to="/profiles" replace />;
  if (error || !profile) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <Card role="alert" className="w-full max-w-sm px-6 py-8 text-center">
          <span className="tone-danger mx-auto mb-4 inline-flex size-14 items-center justify-center rounded-full bg-[var(--tone-soft)] text-[var(--tone-text)]">
            <Icon name="power" size={26} />
          </span>
          <p className="text-lg font-semibold text-text">Không tải được hồ sơ</p>
          <p className="mt-1.5 text-base text-text-2">
            {error instanceof ApiError ? error.message : 'Không tải được dữ liệu.'}
          </p>
          <Button className="mt-6" block loading={isFetching} onClick={() => refetch()}>Thử lại</Button>
        </Card>
      </div>
    );
  }
  return <Outlet />;
}
