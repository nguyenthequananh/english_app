import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import { ROADMAP_KEY, SESSION_KEY, SUMMARY_KEY } from '../api/query-keys';
import { QueryError } from '../components/query-error';
import { toIsoDate } from '../dates';
import { useCurrentProfile } from '../shell/require-profile';
import type { Roadmap, SessionView, Summary } from '../types/api';
import { ButtonLink } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Icon, type IconName } from '../components/ui/icons';
import { PageHeader } from '../components/ui/page-header';
import { ProgressBar } from '../components/ui/progress-bar';
import { Eyebrow, SectionTitle } from '../components/ui/section-heading';
import { SkillTile } from '../components/ui/skill-tile';
import { Skeleton } from '../components/ui/skeleton';
import { StatTile } from '../components/ui/stat-tile';

/** Số lớn có dấu chấm ngăn cách hàng nghìn (12.345), như màn Tiến độ. */
const num = new Intl.NumberFormat('vi-VN');

/**
 * Buổi học hôm nay đang dở, đọc từ cache của màn Buổi học — không gọi API vì GET /session/today sẽ tạo buổi học.
 * Chỉ tin dữ liệu của đúng ngày hôm nay (app mở qua đêm thì cache là của hôm qua).
 */
function useSessionInProgress() {
  const { data } = useQuery<SessionView>({ queryKey: SESSION_KEY, queryFn: endpoints.sessionToday, enabled: false });
  if (!data || data.finished || data.step === 'DONE' || data.studyDate !== toIsoDate(new Date())) return undefined;
  return data;
}

function SessionCard({ summary, dailyMinutes }: { summary: Summary; dailyMinutes?: number }) {
  const inProgress = useSessionInProgress();

  if (summary.finishedToday) {
    return (
      <Card className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <Eyebrow>Buổi học hôm nay</Eyebrow>
          <p className="mt-1.5 flex items-start gap-2 text-xl font-bold text-text">
            {/* Dấu hoàn thành là icon (cùng kiểu dấu "Đã xong" ở Lộ trình), không phải ký tự "✓" trong câu. */}
            <span className="tone-success mt-px inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--tone-soft)] text-[var(--tone-text)]">
              <Icon name="check" size={14} strokeWidth={3} />
            </span>
            Bạn đã hoàn thành buổi học hôm nay
          </p>
          <p className="mt-1 text-base text-text-2">Muốn nhớ lâu hơn? Ôn thêm vài thẻ.</p>
          <ButtonLink to="/review" variant="secondary" className="mt-4">
            Ôn thêm <Icon name="chevron-right" size={16} strokeWidth={2.4} />
          </ButtonLink>
        </div>
        {/* Dấu hoàn thành đã đứng đầu câu nên vòng màu dùng ngọn lửa: chuỗi ngày đã giữ được. */}
        <span className="tone-warning tone-chip inline-flex size-14 shrink-0 items-center justify-center rounded-full">
          <Icon name="flame" filled size={26} strokeWidth={1.8} />
        </span>
      </Card>
    );
  }

  let headline: string;
  let detail: string;
  if (inProgress) {
    const parts = [
      inProgress.reviewsLeft > 0 && `${num.format(inProgress.reviewsLeft)} thẻ ôn`,
      inProgress.newLeft > 0 && `${num.format(inProgress.newLeft)} từ mới`,
    ].filter(Boolean);
    headline = parts.length ? `Còn ${parts.join(' · ')}` : 'Còn bài chính';
    detail = `Đã ôn ${num.format(inProgress.cardsDone)} thẻ — làm tiếp từ chỗ dừng.`;
  } else {
    const minutes = dailyMinutes ? ` · khoảng ${dailyMinutes} phút` : '';
    if (summary.dueCount > 0) {
      headline = `${num.format(summary.dueCount)} thẻ cần ôn`;
      detail = `Rồi học từ mới và bài chính${minutes}`;
    } else {
      headline = 'Từ mới và bài chính';
      detail = `Hôm nay không có thẻ cần ôn${minutes}`;
    }
  }

  return (
    <Card className="flex items-start gap-4">
      <div className="min-w-0 flex-1">
        <Eyebrow>Buổi học hôm nay</Eyebrow>
        <p className="mt-1.5 text-2xl font-bold tabular-nums text-text">{headline}</p>
        <p className="mt-1 text-base text-pretty text-text-2">{detail}</p>
        <ButtonLink to="/session" className="mt-4">
          {inProgress ? 'Tiếp tục buổi học' : 'Bắt đầu buổi học'}
          <Icon name="chevron-right" size={16} strokeWidth={2.4} />
        </ButtonLink>
      </div>
      <span className="tone-accent tone-chip inline-flex size-14 shrink-0 items-center justify-center rounded-full">
        <Icon name="sparkle" filled size={26} strokeWidth={1.6} />
      </span>
    </Card>
  );
}

/**
 * Không có unit đang học (`currentUnit = null`) có thể là: chưa nạp nội dung, xong các unit nhưng chưa qua bài kiểm tra
 * chặng, hoặc đã học hết thật. Summary không phân biệt được nên đọc thêm lộ trình — và không chắc thì không kết luận
 * "đã học hết" (lỗi/thiếu dữ liệu chỉ mời xem lộ trình).
 */
type NoUnitState =
  | { kind: 'empty' }
  | { kind: 'stage-test'; stageCode: string; stageTitle: string }
  | { kind: 'all-done' }
  | { kind: 'unknown' };

function noUnitState(roadmap: Roadmap | undefined): NoUnitState {
  if (!roadmap) return { kind: 'unknown' };
  if (roadmap.stages.every((st) => st.units.length === 0)) return { kind: 'empty' };
  const waiting = roadmap.stages.find((st) => st.status !== 'DONE' && st.testAvailable);
  if (waiting) return { kind: 'stage-test', stageCode: waiting.code, stageTitle: waiting.title };
  // Chặng chưa có unit (nội dung nạp từng chặng một) không tính: chưa có gì để học thì không chặn "đã học hết".
  if (roadmap.stages.filter((st) => st.units.length > 0).every((st) => st.status === 'DONE')) return { kind: 'all-done' };
  return { kind: 'unknown' };
}

const NO_UNIT_COPY: Record<NoUnitState['kind'], { icon: IconName; title: string; link: string }> = {
  empty: { icon: 'book', title: 'Chưa có nội dung để học', link: 'Nạp nội dung trong Cá nhân' },
  'stage-test': { icon: 'star', title: 'Đã học xong các unit của chặng', link: 'Làm bài kiểm tra chặng' },
  'all-done': { icon: 'star', title: 'Bạn đã học hết nội dung hiện có', link: 'Xem lộ trình' },
  unknown: { icon: 'map', title: 'Chưa có unit đang học', link: 'Xem lộ trình' },
};

function NoUnitCard() {
  // Dùng chung cache với Lộ trình/Tiến độ; lỗi thì rơi về trạng thái "chưa rõ", không báo lỗi trùng.
  const roadmapQuery = useQuery({ queryKey: ROADMAP_KEY, queryFn: endpoints.roadmap, meta: { silent: true } });
  if (roadmapQuery.isPending) return <Skeleton className="h-20 rounded-card" />;
  const state = noUnitState(roadmapQuery.data);
  const copy = NO_UNIT_COPY[state.kind];
  const to = state.kind === 'empty' ? '/settings' : state.kind === 'stage-test' ? `/stages/${state.stageCode}/test` : '/roadmap';
  return (
    <Card className="flex items-center gap-4">
      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-text">
        <Icon name={copy.icon} size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-text">{copy.title}</p>
        {state.kind === 'stage-test' && <p className="text-md text-text-2">{state.stageTitle}</p>}
        <Link to={to} className="focus-ring mt-0.5 inline-block rounded text-base font-semibold text-accent-text">{copy.link}</Link>
      </div>
    </Card>
  );
}

function UnitCard({ unit }: { unit: Summary['currentUnit'] }) {
  if (!unit) return <NoUnitCard />;
  // Unit chưa có bài (nội dung nạp dở): "0% · 0/0 bài" vô nghĩa nên ẩn số và thanh.
  const hasLessons = unit.lessonsTotal > 0;
  const ratio = hasLessons ? unit.lessonsDone / unit.lessonsTotal : 0;
  return (
    <Card>
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <Eyebrow>Đang học</Eyebrow>
          <p className="mt-1.5 text-lg font-semibold text-text">
            <span className="text-text-3">{unit.code}</span> · {unit.title}
          </p>
        </div>
        {hasLessons && (
          <p aria-hidden="true" className="shrink-0 text-5xl font-bold leading-none tabular-nums text-text">
            {Math.round(ratio * 100)}<span className="text-xl text-text-3">%</span>
          </p>
        )}
      </div>
      {hasLessons && <ProgressBar value={ratio} label={`Tiến độ unit ${unit.code}`} className="mt-4" />}
      <div className="mt-2.5 flex items-center justify-between gap-3">
        <p className="text-md tabular-nums text-text-3">{hasLessons ? `${unit.lessonsDone}/${unit.lessonsTotal} bài` : 'Unit chưa có bài học'}</p>
        {unit.testReady && (
          <ButtonLink to={`/units/${unit.code}/test`} variant="secondary" size="sm">Làm bài kiểm tra unit</ButtonLink>
        )}
      </div>
    </Card>
  );
}

function Practice() {
  return (
    <section aria-labelledby="today-practice" className="space-y-3">
      <SectionTitle id="today-practice">Luyện tập</SectionTitle>
      <div className="grid grid-cols-4 gap-2.5 sm:gap-3 lg:grid-cols-2">
        {/* Màu kỹ năng chỉ cho đích thuộc loại bài (ôn thẻ → từ vựng, IPA → phát âm); Kho từ, Lộ trình là tiện ích → trung tính. */}
        <SkillTile to="/review" label="Ôn thẻ" icon="cards" tone="VOCAB" />
        <SkillTile to="/words" label="Kho từ" icon="book" tone="neutral" />
        <SkillTile to="/ipa" label="Phát âm IPA" icon="mic" tone="PRONUNCIATION" />
        <SkillTile to="/roadmap" label="Lộ trình" ariaLabel="Mở lộ trình" icon="map" tone="neutral" />
      </div>
    </section>
  );
}

function TodaySkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-6">
      <span role="status" className="sr-only">Đang tải…</span>
      <div className="space-y-4">
        <Skeleton className="h-44 rounded-card" />
        <Skeleton className="h-36 rounded-card" />
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-28 rounded-card" />
          <Skeleton className="h-28 rounded-card" />
        </div>
        <Skeleton className="h-28 rounded-card" />
      </div>
    </div>
  );
}

function greeting(s: Summary | undefined) {
  if (!s) return undefined;
  if (s.finishedToday) return 'Hôm nay bạn đã học xong. Giữ nhịp này nhé!';
  if (s.streak > 0) return `Học hôm nay để giữ chuỗi ${num.format(s.streak)} ngày.`;
  return 'Mỗi ngày một chút — bắt đầu thôi.';
}

export default function TodayPage() {
  const summaryQuery = useQuery({ queryKey: SUMMARY_KEY, queryFn: endpoints.summary });
  const { data: profile } = useCurrentProfile();
  const s = summaryQuery.data;

  return (
    <div data-testid="page-today">
      <PageHeader title={profile ? `Chào, ${profile.name}` : 'Chào bạn'} subtitle={greeting(s)} />
      {summaryQuery.error ? (
        <QueryError error={summaryQuery.error} onRetry={() => summaryQuery.refetch()} />
      ) : !s ? (
        <TodaySkeleton />
      ) : (
        // Điện thoại: một cột, thứ tự buổi học → đang học → luyện tập → số liệu (luyện tập là lối vào màn phụ nên
        // đứng trên số liệu) — đúng thứ tự DOM để trình đọc màn hình đọc như mắt nhìn.
        // ≥lg: hai cột; cột phải đưa số liệu lên đầu bằng `order`.
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start lg:gap-6">
          <div className="space-y-4">
            <SessionCard summary={s} dailyMinutes={profile?.dailyMinutes} />
            <UnitCard unit={s.currentUnit} />
          </div>
          <div className="mt-2 flex flex-col gap-6 lg:mt-0">
            <Practice />
            <div className="grid grid-cols-2 gap-3 lg:order-first">
              <StatTile icon="flame" tone="warning" value={num.format(s.streak)} label="ngày liên tiếp" testId="today-streak" />
              <StatTile icon="cards" tone="VOCAB" value={num.format(s.dueCount)} label="thẻ đến hạn" testId="today-due" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
