import { useNavigate, useParams } from 'react-router';
import { LessonView } from '../components/lesson-view';

export default function LessonPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  return <LessonView key={code} code={code!} doneLabel="Về lộ trình" onDone={() => navigate('/roadmap')} />;
}
