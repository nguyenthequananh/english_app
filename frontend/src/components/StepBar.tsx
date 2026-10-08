import { useEffect, useState } from 'react';
import type { SessionStep } from '../api/types';

const STEPS: { step: SessionStep; label: string }[] = [
  { step: 'REVIEW', label: 'Ôn tập' },
  { step: 'NEW', label: 'Từ mới' },
  { step: 'LESSON', label: 'Bài chính' },
];

function useElapsed() {
  const [start] = useState(() => Date.now());
  const [now, setNow] = useState(start);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const seconds = Math.floor((now - start) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function StepBar({ step, reviewsLeft, newLeft }: { step: SessionStep; reviewsLeft: number; newLeft: number }) {
  const elapsed = useElapsed();
  const order = ['REVIEW', 'NEW', 'LESSON', 'DONE'].indexOf(step);
  const counts: Partial<Record<SessionStep, number>> = { REVIEW: reviewsLeft, NEW: newLeft };
  return (
    <div data-testid="session-step" data-step={step} className="flex flex-wrap items-center gap-2">
      {STEPS.map((s, i) => (
        <span key={s.step} className={`badge text-sm ${i === order ? 'bg-indigo-600 text-white' : i < order ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
          {i < order ? '✓ ' : ''}{s.label}{counts[s.step] !== undefined && i === order ? ` (${counts[s.step]})` : ''}
        </span>
      ))}
      <span className="ml-auto font-mono text-sm text-slate-500">⏱ {elapsed}</span>
    </div>
  );
}
