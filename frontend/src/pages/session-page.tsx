import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, MotionConfig } from 'motion/react';
import { endpoints } from '../api/endpoints';
import { ApiError } from '../api/api-error';
import { notifyError } from '../components/toaster';
import { Flashcard } from '../components/flashcard';
import { LessonView } from '../components/lesson-view';
import { QueryError } from '../components/query-error';
import { SessionTimer, StepBar } from '../components/step-bar';
import { ButtonLink } from '../ui/button';
import { Card } from '../ui/card';
import { Icon } from '../ui/icons';
import { Skeleton } from '../ui/skeleton';
import { TopBar } from '../ui/top-bar';
import type { Grade, SessionView } from '../types/api';

const RELOAD_CODES = ['CARD_MISMATCH', 'NO_SESSION', 'WRONG_STEP'];
export const SESSION_KEY = ['session', 'today'];

const DATE_FORMAT = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' });

/** "2026-10-13" → "Thứ Ba, 13/10" (theo ngày của buổi học, không theo đồng hồ máy). */
function formatStudyDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return undefined;
  const text = DATE_FORMAT.format(d);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function SessionSkeleton() {
  return (
    <div className="space-y-5 pt-1">
      <span role="status" className="sr-only">Đang chuẩn bị buổi học…</span>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-1.5 rounded-full" />
            <Skeleton className="h-3.5 w-16 rounded-md" />
          </div>
        ))}
      </div>
      <Skeleton className="h-[clamp(18rem,calc(100dvh_-_16rem),34rem)] rounded-card" />
      <Skeleton className="h-14 rounded-full" />
    </div>
  );
}

function SessionDone({ view }: { view: SessionView }) {
  return (
    <Card className="flex flex-col items-center px-6 pt-10 pb-8 text-center">
      <MotionConfig reducedMotion="user">
        <motion.span
          initial={{ opacity: 0, transform: 'scale(0.82)' }}
          animate={{ opacity: 1, transform: 'scale(1)' }}
          transition={{ type: 'spring', visualDuration: 0.45, bounce: 0.35 }}
          className="tone-success tone-chip inline-flex size-16 items-center justify-center rounded-full"
        >
          <Icon name="check" size={30} strokeWidth={2.6} />
        </motion.span>
      </MotionConfig>
      <h2 className="mt-5 text-[1.5rem] font-bold leading-tight tracking-[-0.02em] text-balance text-text">🎉 Xong buổi học hôm nay!</h2>
      <p className="mt-2 text-[1rem] text-text-2">
        Bạn đã ôn <span className="font-semibold tabular-nums text-text">{view.cardsDone}</span> thẻ.
      </p>
      <p className="mt-1 text-[0.875rem] text-text-3">Lịch ôn những ngày tới đã được cập nhật.</p>
      <div className="mt-8 flex w-full max-w-sm flex-col gap-2.5">
        <ButtonLink to="/" size="lg" block>Về trang chủ</ButtonLink>
        <div className="grid grid-cols-2 gap-2.5">
          <ButtonLink to="/review" variant="secondary" block>Ôn thêm</ButtonLink>
          <ButtonLink to="/roadmap" variant="secondary" block>Lộ trình</ButtonLink>
        </div>
      </div>
    </Card>
  );
}

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

  const topBar = (
    <TopBar
      title="Buổi học hôm nay"
      subtitle={v ? formatStudyDate(v.studyDate) : undefined}
      back="/"
      trailing={v && v.step !== 'DONE' ? <SessionTimer /> : undefined}
    />
  );

  if (sessionQuery.error) {
    return (
      <>
        {topBar}
        <div className="pt-2">
          <QueryError error={sessionQuery.error} onRetry={() => sessionQuery.refetch()} backTo={{ to: '/', label: 'Về trang chủ' }} />
        </div>
      </>
    );
  }
  if (!v) {
    return (
      <>
        {topBar}
        <SessionSkeleton />
      </>
    );
  }
  const card = v.currentCard;

  return (
    <>
      {topBar}
      <div data-testid="page-session" className="space-y-5 pt-1">
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
        {v.step === 'DONE' && <SessionDone view={v} />}
      </div>
    </>
  );
}
