import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import { ApiError } from '../api/client';
import { ExerciseSet } from '../components/exercise-set';

export default function TestPage({ kind }: { kind: 'UNIT' | 'STAGE' }) {
  const { code } = useParams();
  const queryClient = useQueryClient();
  const [attempt, setAttempt] = useState(0);
  const test = useQuery({
    queryKey: ['test', kind, code],
    queryFn: () => (kind === 'UNIT' ? endpoints.unitTest(code!) : endpoints.stageTest(code!)),
    meta: { silent: true },
  });
  const submit = useMutation({
    mutationFn: (answers: Record<string, string>) => endpoints.submitTest(test.data!.code, answers),
    onSuccess: () => {
      for (const key of ['roadmap', 'summary', 'stats']) queryClient.invalidateQueries({ queryKey: [key] });
    },
  });

  if (test.error) {
    return (
      <div className="card space-y-3">
        <p>{test.error instanceof ApiError ? test.error.message : 'Không tải được bài kiểm tra.'}</p>
        <Link to="/roadmap" className="btn btn-primary">Về lộ trình</Link>
      </div>
    );
  }
  if (!test.data) return <p className="text-slate-500">Đang tải bài kiểm tra…</p>;

  const result = submit.data;
  const percent = (x: number) => `${Math.round(x * 100)}%`;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{kind === 'UNIT' ? 'Bài kiểm tra cuối unit' : 'Bài kiểm tra chuyển chặng'}</h1>
      <p className="text-sm text-slate-500">Cần đạt {percent(test.data.passRatio)} để qua.</p>
      <ExerciseSet key={attempt} exercises={test.data.exercises} results={result?.results} submitting={submit.isPending}
        onSubmit={(answers) => submit.mutate(answers)} />
      {result && (
        <div className={`card ${result.passed ? 'bg-emerald-50' : 'bg-amber-50'}`}>
          {result.passed ? (
            <p className="text-lg font-semibold">
              🎉 Đạt {percent(result.score)}. {kind === 'UNIT' ? 'Unit tiếp theo đã mở.' : 'Chặng tiếp theo đã mở.'}
            </p>
          ) : (
            <>
              <p className="text-lg font-semibold">Chưa đạt: {percent(result.score)} (cần {percent(test.data.passRatio)})</p>
              {result.weakUnits.length > 0 && <p>Nên ôn lại: {result.weakUnits.join(', ')}</p>}
              <button type="button" className="btn btn-primary mt-3"
                onClick={() => {
                  submit.reset();
                  setAttempt((a) => a + 1);
                }}>
                Làm lại
              </button>
            </>
          )}
          <Link to="/roadmap" className="ml-3 text-indigo-600 hover:underline">Về lộ trình</Link>
        </div>
      )}
    </div>
  );
}
