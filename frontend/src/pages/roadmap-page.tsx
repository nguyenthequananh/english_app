import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import type { UnitView } from '../types/api';
import { QueryError } from '../components/query-error';
import { DAY_LABEL, LESSON_TYPE_LABEL, STATUS_LABEL } from '../components/labels';

const STATUS_CLS: Record<string, string> = {
  LOCKED: 'bg-slate-200 text-slate-600', ACTIVE: 'bg-indigo-100 text-indigo-800', DONE: 'bg-emerald-100 text-emerald-800',
};

export default function RoadmapPage() {
  const roadmapQuery = useQuery({ queryKey: ['roadmap'], queryFn: endpoints.roadmap });
  const { data } = roadmapQuery;
  if (roadmapQuery.error) return <QueryError error={roadmapQuery.error} onRetry={() => roadmapQuery.refetch()} />;
  if (!data) return <p className="text-slate-500">Đang tải lộ trình…</p>;
  return (
    <div data-testid="page-roadmap" className="space-y-4">
      <h1 className="text-2xl font-bold">Lộ trình</h1>
      {data.stages.map((stage) => (
        <section key={stage.code} className="card space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold">{stage.code} · {stage.title}</h2>
            <span className="text-sm text-slate-500">Mục tiêu band {stage.targetBand}</span>
            <span className={`badge ${STATUS_CLS[stage.status]}`}>{STATUS_LABEL[stage.status]}</span>
            {stage.testAvailable && stage.status !== 'DONE' && (
              <Link to={`/stages/${stage.code}/test`} className="btn ml-auto bg-amber-100 hover:bg-amber-200">Làm bài kiểm tra chuyển chặng</Link>
            )}
          </div>
          <ul className="space-y-2">
            {stage.units.map((u) => <UnitRow key={u.code} unit={u} />)}
          </ul>
        </section>
      ))}
    </div>
  );
}

function UnitRow({ unit }: { unit: UnitView }) {
  const [open, setOpen] = useState(false);
  if (unit.status === 'LOCKED') {
    return <li className="rounded-lg bg-slate-100 px-3 py-2 text-slate-400">🔒 {unit.code} · {unit.title}</li>;
  }
  return (
    <li className="rounded-lg border border-slate-200">
      <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left" aria-expanded={open}
        onClick={() => setOpen((o) => !o)}>
        <span>{unit.status === 'DONE' ? '✅' : '📘'}</span>
        <span className="font-medium">{unit.code} · {unit.title}</span>
        <span className={`badge ml-auto ${STATUS_CLS[unit.status]}`}>{STATUS_LABEL[unit.status]}</span>
      </button>
      {open && <UnitLessons code={unit.code} />}
    </li>
  );
}

function UnitLessons({ code }: { code: string }) {
  const lessonsQuery = useQuery({ queryKey: ['unitLessons', code], queryFn: () => endpoints.unitLessons(code) });
  const { data } = lessonsQuery;
  if (lessonsQuery.error) {
    return (
      <p role="alert" className="flex items-center gap-2 px-3 pb-2 text-sm text-rose-700">
        Không tải được danh sách bài.
        <button type="button" className="text-indigo-600 hover:underline" onClick={() => lessonsQuery.refetch()}>Thử lại</button>
      </p>
    );
  }
  if (!data) return <p className="px-3 pb-2 text-sm text-slate-500">Đang tải…</p>;
  return (
    <div className="space-y-1 px-3 pb-3">
      {data.map((l) => (
        <Link key={l.code} to={`/lessons/${l.code}`} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-slate-50">
          <span>{l.completed ? '✓' : '○'}</span>
          <span>{l.title}</span>
          <span className="ml-auto text-xs text-slate-500">{DAY_LABEL[l.day] ?? l.day} · {LESSON_TYPE_LABEL[l.type] ?? l.type}</span>
        </Link>
      ))}
      <Link to={`/units/${code}/test`} className="mt-2 inline-block text-sm text-indigo-600 hover:underline">Bài kiểm tra unit</Link>
    </div>
  );
}
