import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import { ApiError } from '../api/api-error';
import type { Profile } from '../types/api';
import { QueryError } from '../components/query-error';
import { Button } from '../components/ui/button';
import { IconLink } from '../components/ui/icon-button';
import { Sheet } from '../components/ui/sheet';
import { TextField } from '../components/ui/text-field';
import { Skeleton } from '../components/ui/skeleton';
import { Icon } from '../components/ui/icons';
import { cn } from '../components/ui/cn';

const avatarCircle = 'relative flex size-24 items-center justify-center rounded-full text-6xl leading-none sm:size-28 sm:text-7xl';

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true" className="animate-spin text-accent">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.2" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function ProfileTile({ profile, busy, disabled, onPick }: { profile: Profile; busy: boolean; disabled: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      aria-busy={busy || undefined}
      className="pressable focus-ring group flex w-full flex-col items-center gap-3 rounded-[28px] p-2 text-center disabled:cursor-default"
    >
      <span
        aria-hidden="true"
        className={cn(
          avatarCircle,
          'bg-surface card-edge transition-shadow duration-(--duration-fast)',
          'group-hover:shadow-[var(--shadow-card),0_0_0_3px_var(--accent)] group-focus-visible:shadow-[var(--shadow-card),0_0_0_3px_var(--accent)]',
        )}
      >
        {busy ? <Spinner /> : profile.avatar || <span className="font-semibold text-accent-text">{profile.name.charAt(0).toUpperCase() || '?'}</span>}
        {profile.hasPin && (
          <span className="absolute right-0.5 bottom-0.5 inline-flex size-8 items-center justify-center rounded-full bg-surface text-text-2 shadow-[var(--shadow-thumb)] sm:right-1 sm:bottom-1">
            <Icon name="lock" size={16} strokeWidth={2.2} />
          </span>
        )}
      </span>
      <span className="line-clamp-2 max-w-[9rem] text-base font-semibold break-words text-text" title={profile.name}>{profile.name}</span>
      {profile.hasPin && <span className="sr-only">(có mã PIN)</span>}
    </button>
  );
}

export default function ProfileSelectPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const manual = params.get('manual') === '1';
  const [pinFor, setPinFor] = useState<Profile | null>(null);
  const [pin, setPin] = useState('');
  const [pickedId, setPickedId] = useState<number | null>(null);

  const profilesQuery = useQuery({ queryKey: ['profiles'], queryFn: endpoints.profiles });
  const profiles = profilesQuery.data;
  const select = useMutation({
    mutationFn: ({ id, pin }: { id: number; pin?: string }) => endpoints.selectProfile(id, pin),
    onSuccess: () => {
      queryClient.removeQueries({ predicate: (q) => !['profiles', 'health'].includes(String(q.queryKey[0])) });
      navigate('/', { replace: true });
    },
    meta: { silent: true },
  });

  useEffect(() => {
    if (!profiles) return;
    if (profiles.length === 0) navigate('/profiles/new', { replace: true });
    else if (!manual && profiles.length === 1 && !profiles[0].hasPin) {
      setPickedId(profiles[0].id);
      select.mutate({ id: profiles[0].id });
    }
    // chỉ chạy khi danh sách hồ sơ thay đổi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles, manual]);

  const errorMessage = select.error instanceof ApiError ? select.error.message : select.error ? 'Không vào được hồ sơ.' : null;

  function pick(p: Profile) {
    setPin('');
    select.reset();
    setPickedId(p.id);
    if (p.hasPin) setPinFor(p);
    else {
      setPinFor(null);
      select.mutate({ id: p.id });
    }
  }

  function submitPin(e: FormEvent) {
    e.preventDefault();
    if (pinFor) select.mutate({ id: pinFor.id, pin });
  }

  return (
    <div data-testid="page-profiles" className="flex min-h-dvh flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="h-11">
        {manual && <IconLink to="/" icon="back" label="Về Hôm nay" />}
      </div>
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center py-8">
        <span aria-hidden="true" className="tone-accent tone-chip mb-5 inline-flex size-14 items-center justify-center rounded-[18px] shadow-float">
          <Icon name="sparkle" filled size={28} strokeWidth={1.6} />
        </span>
        <h1 className="text-large-title text-center text-text">Ai đang học?</h1>
        <p className="mt-2 text-center text-base text-text-2">Chọn hồ sơ của bạn để tiếp tục.</p>

        <div className="mt-10 w-full">
          {profilesQuery.error ? (
            <div className="mx-auto max-w-md"><QueryError error={profilesQuery.error} onRetry={() => profilesQuery.refetch()} /></div>
          ) : !profiles ? (
            <div className="flex justify-center gap-6" aria-busy="true">
              <span className="sr-only">Đang tải…</span>
              {[0, 1].map((i) => (
                <div key={i} className="flex flex-col items-center gap-3 p-2">
                  <Skeleton className="size-24 rounded-full sm:size-28" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <ul className="flex flex-wrap justify-center gap-x-4 gap-y-6 sm:gap-x-6">
              {profiles.map((p) => (
                <li key={p.id} className="w-[calc(50%-0.5rem)] max-w-40 sm:w-36">
                  <ProfileTile
                    profile={p}
                    busy={select.isPending && pickedId === p.id && !p.hasPin}
                    disabled={select.isPending && !p.hasPin}
                    onPick={() => pick(p)}
                  />
                </li>
              ))}
              <li className="w-[calc(50%-0.5rem)] max-w-40 sm:w-36">
                <Link to="/profiles/new" className="pressable focus-ring group flex w-full flex-col items-center gap-3 rounded-[28px] p-2 text-center no-underline">
                  <span aria-hidden="true" className={cn(avatarCircle, 'border-2 border-dashed border-fill-strong text-accent-text group-hover:border-accent')}>
                    <Icon name="plus" size={34} strokeWidth={2} />
                  </span>
                  <span className="text-base font-semibold text-accent-text">Thêm hồ sơ</span>
                </Link>
              </li>
            </ul>
          )}
          {!pinFor && errorMessage && (
            <p role="alert" className="mt-6 text-center text-base font-medium text-danger-text">{errorMessage}</p>
          )}
        </div>
      </div>

      <Sheet
        open={pinFor !== null}
        onOpenChange={(o) => { if (!o) { setPinFor(null); select.reset(); } }}
        title="Nhập mã PIN"
        description={pinFor ? `Hồ sơ "${pinFor.name}" có mã PIN.` : undefined}
      >
        <form className="space-y-4" onSubmit={submitPin}>
          <TextField
            label="Mã PIN"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            maxLength={6}
            value={pin}
            error={errorMessage ?? undefined}
            onChange={(e) => setPin(e.target.value)}
          />
          <Button type="submit" block size="lg" loading={select.isPending} disabled={!pin}>Vào</Button>
        </form>
      </Sheet>
    </div>
  );
}
