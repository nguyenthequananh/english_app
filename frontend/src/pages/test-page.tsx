import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import type { TestDto, TestResult } from '../types/api';
import { ExerciseSet } from '../components/exercise-set';
import { QueryError } from '../components/query-error';
import { Badge } from '../ui/badge';
import { Button, ButtonLink } from '../ui/button';
import { Card } from '../ui/card';
import { Icon } from '../ui/icons';
import { ProgressRing } from '../ui/progress-ring';
import { Skeleton } from '../ui/skeleton';
import { TopBar } from '../ui/top-bar';

const percent = (x: number) => `${Math.round(x * 100)}%`;

/** Cuộn mượt trừ khi người dùng xin giảm chuyển động. */
function scrollBehavior(): ScrollBehavior {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

export default function TestPage({ kind }: { kind: 'UNIT' | 'STAGE' }) {
  const { code } = useParams();
  const queryClient = useQueryClient();
  const [attempt, setAttempt] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);
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
  const result = submit.data;

  // Kết quả nằm trên đầu danh sách câu: nộp xong (đang ở cuối trang) thì đưa người dùng lên xem.
  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView?.({ behavior: scrollBehavior(), block: 'start' });
  }, [result]);

  const title = kind === 'UNIT' ? 'Kiểm tra cuối unit' : 'Kiểm tra chuyển chặng';

  return (
    <>
      <TopBar title={title} subtitle={code} back="/roadmap" />
      <div data-testid="page-test" className="space-y-4 pt-1">
        {test.error ? (
          <QueryError error={test.error} onRetry={() => test.refetch()} backTo={{ to: '/roadmap', label: 'Về lộ trình' }} />
        ) : !test.data ? (
          <TestSkeleton />
        ) : (
          <>
            {result ? (
              <div ref={resultRef} className="scroll-mt-20">
                <ResultCard kind={kind} test={test.data} result={result}
                  onRetry={() => {
                    submit.reset();
                    setAttempt((a) => a + 1);
                    window.scrollTo?.({ top: 0, behavior: scrollBehavior() });
                  }} />
              </div>
            ) : (
              <IntroCard kind={kind} test={test.data} />
            )}
            <ExerciseSet key={attempt} exercises={test.data.exercises} results={result?.results} submitting={submit.isPending}
              onSubmit={(answers) => submit.mutate(answers)} />
          </>
        )}
      </div>
    </>
  );
}

function IntroCard({ kind, test }: { kind: 'UNIT' | 'STAGE'; test: TestDto }) {
  return (
    <Card className="flex items-start gap-3.5">
      <span className="tone-chip tone-accent inline-flex size-11 shrink-0 items-center justify-center rounded-full">
        <Icon name="star" size={22} filled />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-semibold text-text">
          {test.exercises.length} câu · cần đạt {percent(test.passRatio)} để qua
        </p>
        <p className="mt-1 text-base text-text-2">
          {kind === 'UNIT'
            ? 'Đạt bài này thì unit tiếp theo được mở.'
            : 'Bài tổng hợp cả chặng. Đạt thì chặng tiếp theo được mở.'}
        </p>
      </div>
    </Card>
  );
}

function ResultCard({ kind, test, result, onRetry }: {
  kind: 'UNIT' | 'STAGE'; test: TestDto; result: TestResult; onRetry: () => void;
}) {
  const correct = result.results.filter((r) => r.correct).length;
  return (
    <Card as="section" aria-live="polite" className="flex flex-col items-center px-5 pt-7 pb-5 text-center">
      <ProgressRing value={result.score} label="Điểm bài kiểm tra" size={132}>
        <span className="text-5xl leading-none font-bold tabular-nums text-text">
          {Math.round(result.score * 100)}<span className="text-xl font-semibold">%</span>
        </span>
        {result.results.length > 0 && (
          <span className="mt-1 text-xs font-medium tabular-nums text-text-3">{correct}/{result.results.length} câu</span>
        )}
      </ProgressRing>

      <Badge tone={result.passed ? 'success' : 'warning'} className="mt-4">
        <Icon name={result.passed ? 'check' : 'cross'} size={12} strokeWidth={3} />
        {result.passed ? 'Đạt' : 'Chưa đạt'}
      </Badge>

      {/* Vòng nói điểm, nhãn nói đạt/chưa đạt; câu dưới chỉ nói hệ quả để không lặp số. */}
      <p className="mt-2.5 max-w-sm text-lg font-semibold text-balance text-text">
        {result.passed
          ? (kind === 'UNIT' ? 'Unit tiếp theo đã mở.' : 'Chặng tiếp theo đã mở.')
          : `Cần ${percent(test.passRatio)} để qua.`}
      </p>
      {!result.passed && result.weakUnits.length > 0 && (
        <div className="mt-4 w-full rounded-control bg-surface-2 px-4 py-3 text-left">
          <p className="text-sm font-semibold uppercase tracking-[0.04em] text-text-3">Nên ôn lại</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {result.weakUnits.map((u) => (
              <li key={u}><Badge tone="warning">{u}</Badge></li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 flex w-full flex-col gap-2 sm:flex-row-reverse sm:justify-center">
        {result.passed ? (
          <ButtonLink to="/roadmap" size="lg">Về lộ trình</ButtonLink>
        ) : (
          <>
            <Button size="lg" onClick={onRetry}>Làm lại</Button>
            <ButtonLink to="/roadmap" variant="secondary" size="lg">Về lộ trình</ButtonLink>
          </>
        )}
      </div>
      <p className="mt-3 text-sm text-text-3">Xem lại từng câu bên dưới.</p>
    </Card>
  );
}

function TestSkeleton() {
  return (
    <div className="space-y-3">
      <span className="sr-only" role="status">Đang tải bài kiểm tra…</span>
      <Skeleton className="h-[5.5rem] w-full rounded-card" />
      <Skeleton className="h-44 w-full rounded-card" />
      <Skeleton className="h-44 w-full rounded-card" />
    </div>
  );
}
