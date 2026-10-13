import { useNavigate, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import { LessonView } from '../components/lesson-view';
import { dayLabel, lessonTypeLabel } from '../components/labels';
import { TopBar } from '../ui/top-bar';

export default function LessonPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  // Cùng khoá với LessonView nên chỉ có một request; ở đây chỉ đọc để đặt tiêu đề thanh trên.
  const { data: lesson } = useQuery({ queryKey: ['lesson', code], queryFn: () => endpoints.lesson(code!) });
  return (
    <>
      <TopBar
        title={lesson?.title ?? 'Bài học'}
        subtitle={lesson ? `${dayLabel(lesson.day)} · ${lessonTypeLabel(lesson.type)}` : undefined}
        back="/roadmap"
      />
      <div data-testid="page-lesson">
        <LessonView key={code} code={code!} showTitle={false} doneLabel="Về lộ trình" onDone={() => navigate('/roadmap')} />
      </div>
    </>
  );
}
