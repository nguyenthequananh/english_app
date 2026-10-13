import type { CSSProperties } from 'react';
import type { DayMinutes } from '../types/api';
import { toIsoDate } from '../dates';
import { cn } from '../ui/cn';

const WEEKS = 26;
const WEEKDAY_LABELS = ['T2', '', 'T4', '', 'T6', '', ''];

/** 0 = không học, 1..4 = nhạt → đậm. Mốc theo số phút của một buổi (15/30/45). */
function level(minutes: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes <= 0) return 0;
  if (minutes < 15) return 1;
  if (minutes < 30) return 2;
  if (minutes < 45) return 3;
  return 4;
}

/* Thang màu nhấn theo token: pha --accent vào nền ô trống, đậm dần. */
const LEVEL_BG = [
  'var(--fill)',
  'color-mix(in srgb, var(--accent) 28%, var(--surface-2))',
  'color-mix(in srgb, var(--accent) 52%, var(--surface-2))',
  'color-mix(in srgb, var(--accent) 76%, var(--surface-2))',
  'var(--accent)',
];

function Cell({ lv, className, title }: { lv: number; className?: string; title?: string }) {
  return (
    <div
      title={title}
      className={cn('aspect-square rounded-[3px] sm:rounded-[4px]', className ?? 'w-full')}
      style={{ background: LEVEL_BG[lv] } as CSSProperties}
    />
  );
}

/**
 * Lịch học 26 tuần (cột = tuần, hàng = thứ). Lưới co theo bề ngang thẻ (không cuộn ngang).
 * Nhóm có `role="img"` + aria-label tóm tắt; từng ô có `title` (ngày: số phút) để rê chuột xem.
 */
export function Heatmap({ days, today = new Date() }: { days: DayMinutes[]; today?: Date }) {
  const byDate = new Map(days.map((d) => [d.date, d.minutes]));
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const mondayOffset = (end.getDay() + 6) % 7;
  const start = new Date(end);
  start.setDate(end.getDate() - mondayOffset - (WEEKS - 1) * 7);

  const columns: { date: string; minutes: number; future: boolean; month: number; dayOfMonth: number }[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const column = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setDate(start.getDate() + w * 7 + d);
      const iso = toIsoDate(day);
      column.push({ date: iso, minutes: byDate.get(iso) ?? 0, future: day > end, month: day.getMonth(), dayOfMonth: day.getDate() });
    }
    columns.push(column);
  }

  // Nhãn tháng đặt ở cột chứa ngày 1 của tháng (bỏ nhãn quá sát mép phải để không tràn).
  const monthLabels = columns.map((col, i) => {
    const first = col.find((c) => c.dayOfMonth === 1);
    return first && i < WEEKS - 2 ? `Thg ${first.month + 1}` : '';
  });

  const studied = columns.flat().filter((c) => !c.future && c.minutes > 0).length;
  const grid = { gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` } as CSSProperties;

  return (
    <div>
      <div role="img" aria-label={`Lịch học ${WEEKS} tuần: ${studied} ngày có học`} className="flex gap-1.5 sm:gap-2">
        <div aria-hidden="true" className="grid shrink-0 grid-rows-[auto_repeat(7,minmax(0,1fr))] gap-[2px] text-[0.625rem] leading-none text-text-3 sm:gap-[3px]">
          <span className="h-3" />
          {WEEKDAY_LABELS.map((l, i) => <span key={i} className="flex items-center">{l}</span>)}
        </div>
        <div className="min-w-0 flex-1">
          <div aria-hidden="true" className="relative mb-[2px] grid h-3 gap-[2px] sm:mb-[3px] sm:gap-[3px]" style={grid}>
            {monthLabels.map((m, i) => (
              <span key={i} className="overflow-visible text-[0.625rem] leading-none whitespace-nowrap text-text-3">{m}</span>
            ))}
          </div>
          <div className="grid grid-flow-col grid-rows-7 gap-[2px] sm:gap-[3px]" style={grid}>
            {columns.flat().map((c) => (
              c.future
                ? <div key={c.date} className="aspect-square w-full" />
                : <Cell key={c.date} lv={level(c.minutes)} title={`${c.date}: ${c.minutes} phút`} />
            ))}
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="mt-3 flex items-center justify-end gap-1.5 text-[0.6875rem] text-text-3">
        <span className="mr-0.5">Ít</span>
        {[0, 1, 2, 3, 4].map((lv) => <Cell key={lv} lv={lv} className="size-2.5 sm:rounded-[3px]" />)}
        <span className="ml-0.5">Nhiều</span>
      </div>
    </div>
  );
}
