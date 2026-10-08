import { useQuery } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import { Heatmap } from '../components/Heatmap';
import { KnownChart } from '../components/KnownChart';
import { QueryError } from '../components/QueryError';

export default function StatsPage() {
  const statsQuery = useQuery({ queryKey: ['stats'], queryFn: endpoints.stats });
  const s = statsQuery.data;
  if (statsQuery.error) return <QueryError error={statsQuery.error} onRetry={() => statsQuery.refetch()} />;
  if (!s) return <p className="text-slate-500">Đang tải thống kê…</p>;
  const tile = (testId: string, label: string, value: number) => (
    <div className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <p data-testid={testId} className="text-3xl font-bold">{value}</p>
    </div>
  );
  return (
    <div data-testid="page-stats" className="space-y-4">
      <h1 className="text-2xl font-bold">Thống kê</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {tile('stat-streak', 'Chuỗi ngày học', s.streak)}
        {tile('stat-known', 'Từ đã thuộc', s.knownWords)}
        {tile('stat-learning', 'Từ đang học', s.learningWords)}
      </div>
      <section className="card space-y-2">
        <h2 className="font-semibold">Lịch học</h2>
        <Heatmap days={s.heatmap} />
      </section>
      <section className="card space-y-2">
        <h2 className="font-semibold">Số từ đã thuộc theo tuần</h2>
        <KnownChart points={s.knownByWeek} />
      </section>
      <section className="card space-y-2">
        <h2 className="font-semibold">Kết quả bài kiểm tra</h2>
        {s.tests.length === 0 ? <p className="text-sm text-slate-500">Chưa làm bài kiểm tra nào.</p> : (
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr><th className="p-1">Bài</th><th className="p-1">Loại</th><th className="p-1">Điểm</th><th className="p-1">Kết quả</th><th className="p-1">Ngày</th></tr>
            </thead>
            <tbody>
              {s.tests.map((t) => (
                <tr key={`${t.testCode}-${t.takenAt}`} className="border-t border-slate-100">
                  <td className="p-1">{t.testCode}</td>
                  <td className="p-1">{t.kind === 'UNIT' ? 'Unit' : 'Chặng'}</td>
                  <td className="p-1">{Math.round(t.score * 100)}%</td>
                  <td className="p-1">{t.passed ? '✓' : '✗'}</td>
                  <td className="p-1">{t.takenAt.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
