import Markdown from 'react-markdown';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import { ExerciseSet } from './exercise-set';
import { QueryError } from './query-error';

export function LessonView({ code, onDone, doneLabel = 'Xong' }: { code: string; onDone: () => void; doneLabel?: string }) {
  const queryClient = useQueryClient();
  const lessonQuery = useQuery({ queryKey: ['lesson', code], queryFn: () => endpoints.lesson(code) });
  const { data: lesson, isLoading } = lessonQuery;
  const submit = useMutation({
    mutationFn: (answers: Record<string, string>) => endpoints.submitLesson(code, answers),
    onSuccess: () => {
      for (const key of ['summary', 'unitLessons', 'roadmap', 'lesson']) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });

  if (lessonQuery.error) {
    return <QueryError error={lessonQuery.error} onRetry={() => lessonQuery.refetch()} backTo={{ to: '/roadmap', label: 'Về lộ trình' }} />;
  }
  if (isLoading || !lesson) return <p className="text-slate-500">Đang tải bài học…</p>;
  const noExercises = lesson.exercises.length === 0;

  return (
    <article className="space-y-4">
      <h1 className="text-2xl font-bold">{lesson.title}</h1>
      <div className="card markdown"><Markdown>{lesson.bodyMd}</Markdown></div>
      {!noExercises && (
        <>
          <h2 className="text-lg font-semibold">Bài tập</h2>
          <ExerciseSet exercises={lesson.exercises} results={submit.data?.results} submitting={submit.isPending}
            onSubmit={(answers) => submit.mutate(answers)} />
        </>
      )}
      {noExercises && !submit.data && (
        <button type="button" className="btn btn-primary" disabled={submit.isPending} onClick={() => submit.mutate({})}>
          Đã học xong bài này
        </button>
      )}
      {submit.data && (
        <div className="card flex items-center justify-between">
          {!noExercises && <span className="text-lg font-semibold">Điểm: {Math.round(submit.data.score * 100)}%</span>}
          <button type="button" className="btn btn-primary ml-auto" onClick={onDone}>{doneLabel}</button>
        </div>
      )}
    </article>
  );
}
