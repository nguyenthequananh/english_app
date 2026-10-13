import { useQuery } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import { ROADMAP_KEY, STATS_KEY, SUMMARY_KEY } from '../api/query-keys';
import type { Roadmap, Stats, Summary } from '../types/api';
import { Heatmap } from '../components/heatmap';
import { KnownChart } from '../components/known-chart';
import { QueryError } from '../components/query-error';
import { PageHeader } from '../components/ui/page-header';
import { Card } from '../components/ui/card';
import { StatTile } from '../components/ui/stat-tile';
import { ProgressRing } from '../components/ui/progress-ring';
import { ProgressBar } from '../components/ui/progress-bar';
import { ListGroup, ListRow } from '../components/ui/list-row';
import { Badge } from '../components/ui/badge';
import { EmptyState } from '../components/ui/empty-state';
import { Skeleton } from '../components/ui/skeleton';
import { SectionTitle } from '../components/ui/section-heading';
import { Icon } from '../components/ui/icons';

const num = new Intl.NumberFormat('vi-VN');

function encouragement(stats: Stats | undefined) {
  if (!stats) return 'Nhìn lại chặng đường bạn đã đi.';
  if (stats.streak >= 7) return `${num.format(stats.streak)} ngày liên tiếp — phong độ rất tốt, giữ vững nhé!`;
  if (stats.streak >= 2) return `Chuỗi ${stats.streak} ngày đang chạy — mai học tiếp để nối dài.`;
  if (stats.streak === 1) return 'Hôm nay đã có một buổi. Mai học tiếp để bắt đầu chuỗi ngày.';
  return 'Học một buổi hôm nay để bắt đầu chuỗi ngày mới.';
}

/** Tổng thời gian học dạng gọn "14g 30p" (đơn vị nhỏ hơn số) để vừa ô 1/3 bề ngang điện thoại; ≥10 giờ bỏ phút. */
function StudyTime({ minutes }: { minutes: number }) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const unit = 'ml-[1px] text-sm font-semibold tracking-normal text-text-2';
  const full = h > 0 ? `${num.format(h)} giờ${m ? ` ${m} phút` : ''}` : `${m} phút`;
  return (
    <>
      <span aria-hidden="true" className="whitespace-nowrap">
        {h > 0 && <>{num.format(h)}<span className={unit}>g</span></>}
        {(h === 0 || (h < 10 && m > 0)) && <>{h > 0 && ' '}{m}<span className={unit}>p</span></>}
      </span>
      <span className="sr-only">{full}</span>
    </>
  );
}

function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

/** Thẻ tổng quan: chặng đang học (% unit đã xong) + unit hiện tại. Thiếu dữ liệu lộ trình thì không hiện. */
function OverviewCard({ roadmap, summary }: { roadmap: Roadmap | undefined; summary: Summary | undefined }) {
  if (!roadmap || roadmap.stages.length === 0) return null;
  const stage = roadmap.stages.find((s) => s.status === 'ACTIVE');
  if (!stage) {
    const allDone = roadmap.stages.every((s) => s.status === 'DONE');
    if (!allDone) return null;
    return (
      <Card className="flex items-center gap-4">
        <span className="tone-success tone-chip inline-flex size-12 shrink-0 items-center justify-center rounded-full">
          <Icon name="check" size={24} strokeWidth={2.4} />
        </span>
        <div className="min-w-0">
          <p className="text-lg font-bold text-text">Đã xong toàn bộ lộ trình</p>
          <p className="mt-0.5 text-base text-text-2">{roadmap.stages.length} chặng đã hoàn thành.</p>
        </div>
      </Card>
    );
  }
  const done = stage.units.filter((u) => u.status === 'DONE').length;
  const total = stage.units.length;
  const ratio = total ? done / total : 0;
  const unit = summary?.currentUnit ?? null;
  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-4">
        <ProgressRing value={ratio} size={84} label={`Hoàn thành chặng ${stage.title}`}>
          <span className="text-2xl font-bold leading-none tabular-nums text-text">
            {Math.round(ratio * 100)}<span className="text-xs font-semibold text-text-2">%</span>
          </span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-accent-text">Chặng đang học · Band{'\u00a0'}{stage.targetBand}</p>
          <p className="mt-0.5 text-xl font-bold text-balance break-words text-text">{stage.title}</p>
          <p className="mt-0.5 text-md tabular-nums text-text-2">{done}/{total} unit đã xong</p>
        </div>
      </div>
      {unit && (
        <div className="rounded-control bg-fill px-3.5 py-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="min-w-0 truncate text-base font-semibold text-text" title={unit.title}>
              <span className="font-normal text-text-2">Unit: </span>{unit.title}
            </p>
            <span className="shrink-0 text-sm tabular-nums text-text-2">{unit.lessonsDone}/{unit.lessonsTotal} bài</span>
          </div>
          <ProgressBar className="mt-2" value={unit.lessonsTotal ? unit.lessonsDone / unit.lessonsTotal : 0} label={`Tiến độ unit ${unit.title}`} />
        </div>
      )}
    </Card>
  );
}

function StatsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <span className="sr-only">Đang tải…</span>
      <Skeleton className="h-36 rounded-card" />
      <div className="grid grid-cols-3 gap-2.5"><Skeleton className="h-28 rounded-card" /><Skeleton className="h-28 rounded-card" /><Skeleton className="h-28 rounded-card" /></div>
      <Skeleton className="h-48 rounded-card" />
    </div>
  );
}

export default function StatsPage() {
  const statsQuery = useQuery({ queryKey: STATS_KEY, queryFn: endpoints.stats });
  // Thẻ tổng quan dùng chung cache với Hôm nay/Lộ trình; lỗi thì chỉ ẩn thẻ (không chặn trang, không báo trùng).
  const summaryQuery = useQuery({ queryKey: SUMMARY_KEY, queryFn: endpoints.summary, meta: { silent: true } });
  const roadmapQuery = useQuery({ queryKey: ROADMAP_KEY, queryFn: endpoints.roadmap, meta: { silent: true } });
  const s = statsQuery.data;
  const minutes = s ? s.heatmap.reduce((sum, d) => sum + d.minutes, 0) : 0;

  return (
    <div data-testid="page-stats">
      <PageHeader title="Tiến độ" subtitle={encouragement(s)} />
      {statsQuery.error ? (
        <QueryError error={statsQuery.error} onRetry={() => statsQuery.refetch()} />
      ) : !s ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start lg:gap-5">
          <div className="min-w-0 space-y-4 lg:space-y-5">
            {roadmapQuery.isPending ? <Skeleton className="h-36 rounded-card" /> : <OverviewCard roadmap={roadmapQuery.data} summary={summaryQuery.data} />}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              <StatTile icon="flame" tone="warning" value={num.format(s.streak)} label="Chuỗi ngày" testId="stat-streak" />
              <StatTile icon="clock" value={<StudyTime minutes={minutes} />} label="Giờ học" />
              <StatTile icon="star" value={num.format(s.heatmap.length)} label="Buổi đã xong" />
            </div>
            <Card as="section" aria-labelledby="stats-heatmap">
              <SectionTitle id="stats-heatmap" className="mb-3" aside={<span className="text-sm text-text-3">26 tuần gần nhất</span>}>Lịch học</SectionTitle>
              <Heatmap days={s.heatmap} />
            </Card>
          </div>

          <div className="min-w-0 space-y-4 lg:space-y-5">
            <Card as="section" aria-labelledby="stats-known">
              <SectionTitle id="stats-known" className="mb-3">Từ vựng</SectionTitle>
              <div className="mb-4 flex gap-6">
                <div>
                  <p className="text-4xl font-bold leading-none tabular-nums text-text">
                    <span data-testid="stat-known">{num.format(s.knownWords)}</span>
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-text-2">
                    <span aria-hidden="true" className="size-2 rounded-full bg-accent" />Đã thuộc
                  </p>
                </div>
                <div>
                  <p className="text-4xl font-bold leading-none tabular-nums text-text-2">
                    <span data-testid="stat-learning">{num.format(s.learningWords)}</span>
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-text-2">
                    <span aria-hidden="true" className="size-2 rounded-full bg-fill-strong" />Đang học
                  </p>
                </div>
              </div>
              <KnownChart points={s.knownByWeek} />
            </Card>

            {s.tests.length === 0 ? (
              <ListGroup title="Bài kiểm tra">
                <li><EmptyState icon="star" title="Chưa làm bài kiểm tra nào" description="Xong một unit là có bài kiểm tra để đo mức nắm bài." /></li>
              </ListGroup>
            ) : (
              <ListGroup title="Bài kiểm tra">
                {s.tests.map((t) => (
                  <ListRow
                    key={`${t.testCode}-${t.takenAt}`}
                    leading={
                      <span className={`${t.passed ? 'tone-success' : 'tone-warning'} inline-flex size-8 items-center justify-center rounded-full bg-[var(--tone-soft)] text-[var(--tone-text)]`}>
                        <Icon name={t.passed ? 'check' : 'cross'} size={16} strokeWidth={2.6} />
                      </span>
                    }
                    title={t.testCode}
                    subtitle={`${t.kind === 'UNIT' ? 'Kiểm tra unit' : 'Kiểm tra chặng'} · ${formatDate(t.takenAt)}`}
                    trailing={
                      <>
                        <span className="text-base font-semibold tabular-nums text-text">{Math.round(t.score * 100)}%</span>
                        <Badge tone={t.passed ? 'success' : 'warning'} className="max-sm:sr-only">{t.passed ? 'Đạt' : 'Chưa đạt'}</Badge>
                      </>
                    }
                  />
                ))}
              </ListGroup>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
