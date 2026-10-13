import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import { ApiError } from '../api/api-error';
import type { Profile } from '../types/api';
import { QueryError } from '../components/query-error';

export default function ProfileSelectPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const manual = params.get('manual') === '1';
  const [pinFor, setPinFor] = useState<Profile | null>(null);
  const [pin, setPin] = useState('');

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
    else if (!manual && profiles.length === 1 && !profiles[0].hasPin) select.mutate({ id: profiles[0].id });
    // chỉ chạy khi danh sách hồ sơ thay đổi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles, manual]);

  const errorMessage = select.error instanceof ApiError ? select.error.message : null;

  return (
    <div data-testid="page-profiles" className="mx-auto mt-16 max-w-2xl p-4">
      <h1 className="mb-6 text-center text-2xl font-bold">Ai đang học?</h1>
      {profilesQuery.error && (
        <div className="mb-6"><QueryError error={profilesQuery.error} onRetry={() => profilesQuery.refetch()} /></div>
      )}
      <div className="flex flex-wrap justify-center gap-4">
        {profiles?.map((p) => (
          <button key={p.id} type="button" className="card flex w-36 flex-col items-center gap-2 hover:ring-2 hover:ring-indigo-400"
            onClick={() => {
              setPin('');
              select.reset();
              if (p.hasPin) setPinFor(p);
              else {
                setPinFor(null);
                select.mutate({ id: p.id });
              }
            }}>
            <span className="text-5xl">{p.avatar ?? '🙂'}</span>
            <span className="font-medium">{p.name}{p.hasPin ? ' 🔒' : ''}</span>
          </button>
        ))}
        <Link to="/profiles/new" className="card flex w-36 flex-col items-center justify-center gap-2 text-indigo-600">
          <span className="text-4xl">＋</span>
          <span>Thêm hồ sơ</span>
        </Link>
      </div>

      {pinFor && (
        <form className="card mx-auto mt-6 max-w-xs space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            select.mutate({ id: pinFor.id, pin });
          }}>
          <label className="block text-sm font-medium" htmlFor="pin">Mã PIN</label>
          <input id="pin" className="input" type="password" inputMode="numeric" autoFocus value={pin}
            onChange={(e) => setPin(e.target.value)} />
          {errorMessage && <p className="text-sm text-rose-600">{errorMessage}</p>}
          <button type="submit" className="btn btn-primary w-full" disabled={select.isPending}>Vào</button>
        </form>
      )}
      {!pinFor && errorMessage && <p className="mt-4 text-center text-rose-600">{errorMessage}</p>}
    </div>
  );
}
