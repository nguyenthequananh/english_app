import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';

export default function TodayPage() {
  const { data: s } = useQuery({ queryKey: ['summary'], queryFn: endpoints.summary });
  if (!s) return <p className="text-slate-500">Đang tải…</p>;
  const unit = s.currentUnit;
  return (
    <div data-testid="page-today" className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card text-2xl font-semibold">🔥 {s.streak} ngày liên tiếp</div>
        <div className="card text-2xl font-semibold">{s.dueCount} thẻ đến hạn</div>
      </div>

      {unit ? (
        <div className="card space-y-2">
          <p className="text-sm text-slate-500">Đang học</p>
          <p className="text-lg font-semibold">{unit.code} · {unit.title}</p>
          <div className="h-2 rounded-full bg-slate-200">
            <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${unit.lessonsTotal ? (unit.lessonsDone / unit.lessonsTotal) * 100 : 0}%` }} />
          </div>
          <p className="text-sm">{unit.lessonsDone}/{unit.lessonsTotal} bài</p>
          {unit.testReady && <Link to={`/units/${unit.code}/test`} className="btn bg-amber-100 hover:bg-amber-200">Làm bài kiểm tra unit</Link>}
        </div>
      ) : (
        <div className="card">Bạn đã học hết nội dung hiện có. <Link to="/roadmap" className="text-indigo-600">Xem lộ trình</Link></div>
      )}

      {s.finishedToday ? (
        <div className="card space-y-3 bg-emerald-50">
          <p className="text-lg font-semibold">✓ Bạn đã hoàn thành buổi học hôm nay</p>
          <Link to="/review" className="btn btn-primary">Ôn thêm</Link>
        </div>
      ) : (
        <Link to="/session" className="btn btn-primary w-full py-4 text-lg">Bắt đầu buổi học</Link>
      )}
    </div>
  );
}
