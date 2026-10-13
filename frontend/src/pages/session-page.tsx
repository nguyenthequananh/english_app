import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import { ApiError } from '../api/client';
import { notifyError } from '../components/toaster';
import { Flashcard } from '../components/flashcard';
import { LessonView } from '../components/lesson-view';
import { QueryError } from '../components/query-error';
import { StepBar } from '../components/step-bar';
import type { Grade } from '../api/types';

const RELOAD_CODES = ['CARD_MISMATCH', 'NO_SESSION', 'WRONG_STEP'];
const SESSION_KEY = ['session', 'today'];

export default function SessionPage() {
  const queryClient = useQueryClient();
  const sessionQuery = useQuery({ queryKey: SESSION_KEY, queryFn: endpoints.sessionToday });
  const v = sessionQuery.data;
  const answer = useMutation({
    mutationFn: ({ wordId, grade }: { wordId: number; grade: Grade }) => endpoints.answerCard(wordId, grade),
    onSuccess: (next) => queryClient.setQueryData(SESSION_KEY, next),
    onError: (e) => {
      if (e instanceof ApiError && RELOAD_CODES.includes(e.code)) queryClient.invalidateQueries({ queryKey: SESSION_KEY });
      else notifyError(e);
    },
    meta: { silent: true },
  });

  if (sessionQuery.error) {
    return <QueryError error={sessionQuery.error} onRetry={() => sessionQuery.refetch()} backTo={{ to: '/', label: 'Về trang chủ' }} />;
  }
  if (!v) return <p className="text-slate-500">Đang chuẩn bị buổi học…</p>;
  const card = v.currentCard;

  return (
    <div data-testid="page-session" className="space-y-4">
      <StepBar step={v.step} reviewsLeft={v.reviewsLeft} newLeft={v.newLeft} />
      {(v.step === 'REVIEW' || v.step === 'NEW') && card && (
        <Flashcard key={`${card.id}-${v.cardsDone}`} word={card} busy={answer.isPending}
          onGrade={(grade) => answer.mutate({ wordId: card.id, grade })} />
      )}
      {v.step === 'LESSON' && v.lessonCode && (
        <LessonView key={v.lessonCode} code={v.lessonCode} doneLabel="Hoàn thành buổi học"
          onDone={() => {
            queryClient.invalidateQueries({ queryKey: SESSION_KEY });
            queryClient.invalidateQueries({ queryKey: ['summary'] });
          }} />
      )}
      {v.step === 'DONE' && (
        <div className="card space-y-3 text-center">
          <p className="text-2xl font-semibold">🎉 Xong buổi học hôm nay!</p>
          <p>Bạn đã ôn {v.cardsDone} thẻ.</p>
          <div className="flex justify-center gap-2">
            <Link to="/" className="btn btn-primary">Về trang chủ</Link>
            <Link to="/review" className="btn bg-slate-100">Ôn thêm</Link>
            <Link to="/roadmap" className="btn bg-slate-100">Lộ trình</Link>
          </div>
        </div>
      )}
    </div>
  );
}
