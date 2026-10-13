import { useId, useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { endpoints } from '../api/endpoints';
import { ROADMAP_KEY, unitLessonsKey } from '../api/query-keys';
import type { StageView, Status, UnitView } from '../types/api';
import { QueryError } from '../components/query-error';
import { dayLabel, lessonSkill, lessonTypeLabel, STATUS_LABEL } from '../components/labels';
import { Badge } from '../components/ui/badge';
import { EmptyState } from '../components/ui/empty-state';
import { Icon } from '../components/ui/icons';
import { ListGroup, ListRow } from '../components/ui/list-row';
import { PageHeader } from '../components/ui/page-header';
import { ProgressBar } from '../components/ui/progress-bar';
import { Eyebrow } from '../components/ui/section-heading';
import { Skeleton } from '../components/ui/skeleton';
import { SKILL_META, toneClass } from '../components/ui/skill';
import { cn } from '../components/ui/cn';
import { DURATION, EASE_OUT, FADE, SPRING } from '../components/ui/motion';

const STATUS_TONE: Record<Status, 'neutral' | 'accent' | 'success'> = { LOCKED: 'neutral', ACTIVE: 'accent', DONE: 'success' };

/** Đường kẻ giữa các dòng, thụt sau phần leading — cùng cách ListRow vẽ để hàng tự làm và ListRow nằm chung một nhóm. */
const ROW_DIVIDER = 'group-[:not(:first-child)]/row:border-t group-[:not(:first-child)]/row:border-separator';

/*
 * Mở/đóng unit: chiều cao bảng bài và góc xoay chevron chạy chung MỘT lò xo (cùng một object transition) nên luôn
 * khớp nhau, ngắt giữa chừng được và đường về tự đối xứng. Độ mờ đi nhanh hơn chiều cao để nội dung không lộ ra
 * bị cắt dở lúc thu lại.
 */
const EXPAND = { ...SPRING, opacity: { duration: DURATION.press, ease: EASE_OUT } };

export default function RoadmapPage() {
  const roadmapQuery = useQuery({ queryKey: ROADMAP_KEY, queryFn: endpoints.roadmap });
  const { data } = roadmapQuery;
  const units = data?.stages.flatMap((s) => s.units) ?? [];
  const doneUnits = units.filter((u) => u.status === 'DONE').length;

  return (
    <div data-testid="page-roadmap">
      <PageHeader
        title="Lộ trình"
        subtitle={data && units.length > 0
          ? <span className="tabular-nums">Đã xong {doneUnits}/{units.length} unit</span>
          : 'Chặng → unit → bài học theo từng ngày trong tuần'}
      />
      {roadmapQuery.error ? (
        <QueryError error={roadmapQuery.error} onRetry={() => roadmapQuery.refetch()} />
      ) : !data ? (
        <RoadmapSkeleton />
      ) : data.stages.length === 0 ? (
        <EmptyState icon="map" title="Chưa có nội dung lộ trình" description="Nạp nội dung học ở Cá nhân → Nội dung rồi quay lại đây." />
      ) : (
        <div className="space-y-8 lg:max-w-3xl">
          {data.stages.map((stage) => <StageSection key={stage.code} stage={stage} />)}
        </div>
      )}
    </div>
  );
}

function StageSection({ stage }: { stage: StageView }) {
  const headingId = useId();
  const done = stage.units.filter((u) => u.status === 'DONE').length;
  return (
    <section aria-labelledby={headingId} className="space-y-2.5">
      <div className="flex items-end gap-3 px-1">
        <div className="min-w-0 flex-1">
          <Eyebrow>Chặng {stage.code}</Eyebrow>
          <h2 id={headingId} className="mt-0.5 text-2xl font-bold text-balance text-text">
            {stage.title}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-md text-text-2">
            <span>Mục tiêu band {stage.targetBand}</span>
            <span aria-hidden="true" className="text-text-3">·</span>
            <span className="tabular-nums">{done}/{stage.units.length} unit</span>
          </p>
        </div>
        <Badge tone={STATUS_TONE[stage.status]} className="mb-1">{STATUS_LABEL[stage.status]}</Badge>
      </div>
      <ListGroup>
        {stage.units.map((u, i) => <UnitRow key={u.code} unit={u} order={i + 1} />)}
        {stage.testAvailable && stage.status !== 'DONE' && (
          <ListRow
            to={`/stages/${stage.code}/test`}
            title={<span className="font-semibold text-accent-text">Làm bài kiểm tra chuyển chặng</span>}
            leading={(
              <span className="tone-chip tone-accent inline-flex size-9 items-center justify-center rounded-full">
                <Icon name="star" size={18} filled />
              </span>
            )}
          />
        )}
      </ListGroup>
    </section>
  );
}

function UnitNumber({ order, status }: { order: number; status: Status }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-full text-base font-bold tabular-nums',
        status === 'ACTIVE' && 'bg-accent text-on-accent shadow-[0_4px_12px_-4px_var(--accent)]',
        status === 'DONE' && 'bg-fill text-text-2',
        status === 'LOCKED' && 'bg-fill text-text-3',
      )}
    >
      {order}
    </span>
  );
}

function UnitRow({ unit, order }: { unit: UnitView; order: number }) {
  // Unit đang học mở sẵn để thấy ngay bài hôm nay; unit khác bấm mới mở.
  const [open, setOpen] = useState(unit.status === 'ACTIVE');
  const panelId = useId();
  // Giảm chuyển động: bỏ co giãn chiều cao, chỉ còn mờ dần ngắn.
  const reduceMotion = useReducedMotion();
  const collapsed = reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 };
  const transition = reduceMotion ? FADE : EXPAND;

  if (unit.status === 'LOCKED') {
    return (
      <li className="group/row">
        <div className="flex w-full items-center gap-3 pl-4">
          <UnitNumber order={order} status="LOCKED" />
          <span className={cn('flex min-h-[3.75rem] min-w-0 flex-1 items-center gap-3 py-2.5 pr-4', ROW_DIVIDER)}>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 block text-base text-pretty text-text-3">{unit.title}</span>
              <span className="mt-0.5 block text-sm text-text-3">{unit.code}</span>
            </span>
            <Icon name="lock" size={18} className="text-text-3" />
            <span className="sr-only">{STATUS_LABEL.LOCKED}</span>
          </span>
        </div>
      </li>
    );
  }

  const active = unit.status === 'ACTIVE';
  return (
    <li className={cn('group/row', active && 'bg-[color-mix(in_srgb,var(--accent)_6%,transparent)]')}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="focus-ring flex w-full items-center gap-3 pl-4 text-left transition-colors duration-(--duration-press) [outline-offset:-2px] hover:bg-fill active:bg-fill-strong"
      >
        <UnitNumber order={order} status={unit.status} />
        <span className={cn('flex min-h-[3.75rem] min-w-0 flex-1 items-center gap-3 py-2.5 pr-4', ROW_DIVIDER)}>
          <span className="min-w-0 flex-1">
            <span className={cn('line-clamp-2 block text-base text-pretty text-text', active && 'font-semibold')}>{unit.title}</span>
            <span className="mt-0.5 block text-sm text-text-3">
              {active && <><span className="font-semibold text-accent-text">{STATUS_LABEL.ACTIVE}</span> · </>}
              {unit.code}
            </span>
          </span>
          {active ? null : (
            <span className="tone-success inline-flex size-6 items-center justify-center rounded-full bg-[var(--tone-soft)] text-[var(--tone-text)]">
              <Icon name="check" size={14} strokeWidth={3} />
              <span className="sr-only">{STATUS_LABEL.DONE}</span>
            </span>
          )}
          <motion.span
            aria-hidden="true"
            className="inline-flex text-text-3 opacity-70"
            initial={false}
            animate={{ rotate: open ? 90 : 0 }}
            transition={reduceMotion ? { duration: 0 } : transition}
          >
            <Icon name="chevron-right" size={16} strokeWidth={2.4} />
          </motion.span>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            key="panel"
            initial={collapsed}
            animate={{ height: 'auto', opacity: 1 }}
            exit={collapsed}
            transition={transition}
            className="overflow-hidden"
          >
            <UnitLessons code={unit.code} />
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function UnitLessons({ code }: { code: string }) {
  const lessonsQuery = useQuery({ queryKey: unitLessonsKey(code), queryFn: () => endpoints.unitLessons(code) });
  const { data } = lessonsQuery;
  if (lessonsQuery.error) {
    return (
      <p role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pt-1 pb-4 pl-16 text-base text-danger-text">
        Không tải được danh sách bài.
        <button type="button" className="focus-ring font-semibold text-accent-text" onClick={() => lessonsQuery.refetch()}>Thử lại</button>
      </p>
    );
  }
  if (!data) {
    return (
      <div className="space-y-2 pt-1 pr-4 pb-4 pl-16">
        <span className="sr-only" role="status">Đang tải danh sách bài…</span>
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-4/5" />
      </div>
    );
  }
  const completed = data.filter((l) => l.completed).length;
  const testReady = data.length > 0 && completed === data.length;
  return (
    <div className="pt-0.5 pr-3 pb-3 pl-[3.75rem]">
      <ProgressBar value={data.length ? completed / data.length : 0} label={`Tiến độ ${code}`} className="mr-1 mb-1.5 ml-2" />
      <p className="mb-1 ml-2 text-sm tabular-nums text-text-3">{completed}/{data.length} bài đã học</p>
      <ul>
        {data.map((l) => {
          const skill = lessonSkill(l.type);
          return (
            <li key={l.code}>
              <Link to={`/lessons/${l.code}`}
                className="pressable focus-ring flex min-h-14 items-center gap-3 rounded-[14px] px-2 py-2 hover:bg-fill active:bg-fill-strong">
                <span className={cn('tone-chip inline-flex size-9 shrink-0 items-center justify-center rounded-full', toneClass(skill ?? 'neutral'))}>
                  <Icon name={skill ? SKILL_META[skill].icon : 'book'} size={17} strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 block text-base font-medium text-pretty text-text">{l.title}</span>
                  <span className="mt-0.5 block text-sm text-text-3">
                    {dayLabel(l.day)} · {lessonTypeLabel(l.type)}
                  </span>
                </span>
                {l.completed ? (
                  <span className="tone-success inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--tone)] text-surface">
                    <Icon name="check" size={13} strokeWidth={3.2} />
                    <span className="sr-only">Đã học</span>
                  </span>
                ) : (
                  <span aria-hidden="true" className="size-6 shrink-0 rounded-full border-2 border-text-3/40" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      {testReady ? (
        <Link to={`/units/${code}/test`}
          className="pressable focus-ring mt-1.5 flex min-h-12 items-center gap-3 rounded-[14px] bg-accent-soft px-3 font-semibold text-accent-text hover:bg-[color-mix(in_srgb,var(--accent)_20%,transparent)]">
          <Icon name="star" size={18} filled />
          <span className="flex-1">Bài kiểm tra unit</span>
          <Icon name="chevron-right" size={16} strokeWidth={2.4} />
        </Link>
      ) : (
        <p className="mt-1.5 flex items-center gap-2 px-2 text-sm text-text-3">
          <Icon name="lock" size={14} />
          Học xong {data.length - completed} bài còn lại để mở bài kiểm tra unit.
        </p>
      )}
    </div>
  );
}

function RoadmapSkeleton() {
  return (
    <div className="space-y-3">
      <span className="sr-only" role="status">Đang tải lộ trình…</span>
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-7 w-48" />
      <div className="space-y-3 rounded-card bg-surface p-4 card-edge">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
