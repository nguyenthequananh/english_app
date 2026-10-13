import type { DayMinutes } from '../types/api';
import { toIsoDate } from '../dates';

const WEEKS = 26;

function color(minutes: number) {
  if (minutes <= 0) return 'bg-slate-100';
  if (minutes < 15) return 'bg-emerald-200';
  if (minutes < 30) return 'bg-emerald-400';
  return 'bg-emerald-600';
}

export function Heatmap({ days, today = new Date() }: { days: DayMinutes[]; today?: Date }) {
  const byDate = new Map(days.map((d) => [d.date, d.minutes]));
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const mondayOffset = (end.getDay() + 6) % 7;
  const start = new Date(end);
  start.setDate(end.getDate() - mondayOffset - (WEEKS - 1) * 7);

  const columns: { date: string; minutes: number; future: boolean }[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const column = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setDate(start.getDate() + w * 7 + d);
      const iso = toIsoDate(day);
      column.push({ date: iso, minutes: byDate.get(iso) ?? 0, future: day > end });
    }
    columns.push(column);
  }

  return (
    <div className="flex gap-1 overflow-x-auto" aria-label="Lịch học 26 tuần">
      {columns.map((col, i) => (
        <div key={i} className="flex flex-col gap-1">
          {col.map((c) => (
            <div key={c.date} title={`${c.date}: ${c.minutes} phút`}
              className={`h-3 w-3 rounded-sm ${c.future ? 'bg-transparent' : color(c.minutes)}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
