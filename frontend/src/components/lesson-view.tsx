import { lazy, Suspense } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import { LESSON_KEY, lessonKey, ROADMAP_KEY, SUMMARY_KEY, UNIT_LESSONS_KEY } from '../api/query-keys';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Icon } from './ui/icons';
import { ProgressRing } from './ui/progress-ring';
import { SectionTitle } from './ui/section-heading';
import { Skeleton } from './ui/skeleton';
import { SKILL_META } from './ui/skill';
import { ExerciseSet } from './exercise-set';
import { QueryError } from './query-error';
import { dayLabel, lessonSkill, lessonTypeLabel } from './labels';

/*
 * react-markdown + remark-gfm (~150 kB) chỉ cần khi thật sự hiện lý thuyết, nên tách thành chunk riêng.
 * LessonView còn nằm trong bước LESSON của Buổi học — phần lớn buổi học là thẻ, không cần tải bộ Markdown.
 */
const LessonMarkdown = lazy(() => import('./lesson-markdown'));

/**
 * Lý thuyết (Markdown) + bài tập của một bài. Dùng ở trang Bài học và bước LESSON của buổi học.
 * `showTitle={false}` khi trang bọc ngoài đã có tiêu đề bài (TopBar) để không lặp heading.
 */
export function LessonView({ code, onDone, doneLabel = 'Xong', showTitle = true }: {
  code: string;
  onDone: () => void;
  doneLabel?: string;
  showTitle?: boolean;
}) {
  const queryClient = useQueryClient();
  // Lỗi tải bài hiện ngay trong khung (QueryError) nên không bắn thêm toast — tránh báo một lỗi hai lần.
  const lessonQuery = useQuery({ queryKey: lessonKey(code), queryFn: () => endpoints.lesson(code), meta: { silent: true } });
  const { data: lesson, isLoading } = lessonQuery;
  const submit = useMutation({
    mutationFn: (answers: Record<string, string>) => endpoints.submitLesson(code, answers),
    onSuccess: () => {
      for (const key of [SUMMARY_KEY, UNIT_LESSONS_KEY, ROADMAP_KEY, LESSON_KEY]) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });

  if (lessonQuery.error) {
    return <QueryError error={lessonQuery.error} onRetry={() => lessonQuery.refetch()} backTo={{ to: '/roadmap', label: 'Về lộ trình' }} />;
  }
  if (isLoading || !lesson) return <LessonSkeleton />;
  const noExercises = lesson.exercises.length === 0;
  const skill = lessonSkill(lesson.type);
  const result = submit.data;

  return (
    <article className="space-y-5">
      <header className="space-y-2.5 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={skill ?? 'neutral'}>
            {skill && <Icon name={SKILL_META[skill].icon} size={13} strokeWidth={2.2} />}
            {lessonTypeLabel(lesson.type)}
          </Badge>
          {showTitle && <span className="text-sm text-text-3">{dayLabel(lesson.day)}</span>}
          {lesson.bestScore !== null && !noExercises && (
            <span className="ml-auto text-sm text-text-3">
              Điểm cao nhất <span className="font-semibold tabular-nums text-text-2">{Math.round(lesson.bestScore * 100)}%</span>
            </span>
          )}
        </div>
        {showTitle && <h2 className="text-4xl font-bold text-balance text-text">{lesson.title}</h2>}
      </header>

      <Card as="section" className="markdown px-5 py-5 text-prose sm:px-6 [&_h2:first-child]:mt-0 [&_h3]:mt-6 [&_h2]:mt-7 [&_h2]:mb-3 [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_table_td]:border-t [&_table_td]:border-separator [&_table_td]:px-3 [&_table_td]:py-2 [&_table_td]:align-top [&_table_th]:bg-fill [&_table_th]:px-3 [&_table_th]:py-2 [&_table_th]:text-left [&_table_th]:font-semibold [&_table_th:first-child]:rounded-l-lg [&_table_th:last-child]:rounded-r-lg [&_del]:text-text-3 [&_hr]:my-6 [&_hr]:border-separator">
        <Suspense fallback={<MarkdownSkeleton />}>
          <LessonMarkdown source={lesson.bodyMd} />
        </Suspense>
      </Card>

      {!noExercises && (
        <section className="space-y-3" aria-labelledby={`${code}-exercises`}>
          <SectionTitle id={`${code}-exercises`} className="px-1 pt-2"
            aside={<span className="text-md text-text-3 tabular-nums">{lesson.exercises.length} câu</span>}>
            Bài tập
          </SectionTitle>
          <ExerciseSet exercises={lesson.exercises} results={result?.results} submitting={submit.isPending}
            onSubmit={(answers) => submit.mutate(answers)} />
        </section>
      )}

      {noExercises && !result && (
        <Button size="lg" block loading={submit.isPending} onClick={() => submit.mutate({})}>
          Đã học xong bài này
        </Button>
      )}

      {result && (
        <Card className="flex items-center gap-4" aria-live="polite">
          {!noExercises ? (
            <>
              <ProgressRing value={result.score} label="Điểm bài tập" size={60}>
                <span className="text-sm font-bold tabular-nums text-text">
                  {result.results.filter((r) => r.correct).length}/{result.results.length}
                </span>
              </ProgressRing>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold tabular-nums text-text">Điểm: {Math.round(result.score * 100)}%</p>
                <p className="text-base text-text-2">{scoreNote(result.score)}</p>
              </div>
            </>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="tone-success inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--tone-soft)] text-[var(--tone-text)]">
                <Icon name="check" size={20} strokeWidth={2.6} />
              </span>
              <p className="text-lg font-semibold text-text">Đã học xong bài này</p>
            </div>
          )}
        </Card>
      )}
      {result && <Button size="lg" block onClick={onDone}>{doneLabel}</Button>}
    </article>
  );
}

function scoreNote(score: number) {
  if (score >= 0.8) return 'Làm tốt lắm!';
  if (score >= 0.5) return 'Khá ổn — xem lại các câu sai ở trên.';
  return 'Đọc lại phần lý thuyết rồi làm lại lần sau.';
}

function LessonSkeleton() {
  return (
    <div className="space-y-5 pt-1">
      <span className="sr-only" role="status">Đang tải bài học…</span>
      <Skeleton className="h-6 w-24 rounded-full" />
      <div className="space-y-3 rounded-card bg-surface p-5 card-edge">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="mt-4 h-28 w-full" />
      </div>
    </div>
  );
}

function MarkdownSkeleton() {
  return (
    <div className="space-y-3">
      <span className="sr-only" role="status">Đang tải nội dung bài…</span>
      <Skeleton className="h-7 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  );
}
