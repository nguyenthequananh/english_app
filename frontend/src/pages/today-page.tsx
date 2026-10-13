import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import { QueryError } from '../components/query-error';
import { toIsoDate } from '../dates';
import { useCurrentProfile } from '../shell/require-profile';
import type { SessionView, Summary } from '../types/api';
import { ButtonLink } from '../ui/button';
import { Card } from '../ui/card';
import { cn } from '../ui/cn';
import { Icon, type IconName } from '../ui/icons';
import { PageHeader } from '../ui/page-header';
import { ProgressBar } from '../ui/progress-bar';
import { toneClass } from '../ui/skill';
import { Skeleton } from '../ui/skeleton';
import { StatTile } from '../ui/stat-tile';
import { SESSION_KEY } from './session-page';

/**
 * Ô Luyện tập — biến thể cục bộ của `SkillTile` (ui), khác ở hai điểm:
 * - nhận `ariaLabel`: ô "Lộ trình" trùng tên với mục điều hướng nên tên đọc là "Mở lộ trình";
 * - icon neo ở đỉnh (không căn giữa dọc): ở 390px nhãn "Phát âm IPA" xuống 2 dòng, căn giữa sẽ làm icon ô đó lệch lên.
 * TODO(review): đưa hai điểm này vào SkillTile rồi bỏ bản sao.
 */
function PracticeTile({ to, label, ariaLabel, icon, tone }: {
  to: string;
  label: string;
  ariaLabel?: string;
  icon: IconName;
  tone: Parameters<typeof toneClass>[0];
}) {
  return (
    <Link
      to={to}
      aria-label={ariaLabel}
      className={cn(
        'pressable focus-ring flex min-h-[6.75rem] flex-col items-center gap-2.5 rounded-card bg-surface px-1.5 pt-4 pb-3 text-center card-edge',
        'hover:bg-[color-mix(in_srgb,var(--surface)_94%,var(--text))]',
        toneClass(tone),
      )}
    >
      <span className="tone-chip inline-flex size-12 shrink-0 items-center justify-center rounded-full shadow-[0_6px_14px_-6px_var(--tone)] dark:shadow-none">
        <Icon name={icon} size={23} strokeWidth={2} />
      </span>
      <span className="text-[0.8125rem] font-semibold leading-tight text-balance text-text">{label}</span>
    </Link>
  );
}

function Eyebrow({ children }: { children: string }) {
  return <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.05em] text-text-3">{children}</p>;
}

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
          <p className="mt-1.5 text-[1.25rem] font-bold leading-snug tracking-[-0.015em] text-text">✓ Bạn đã hoàn thành buổi học hôm nay</p>
          <p className="mt-1 text-[0.9375rem] leading-snug text-text-2">Muốn nhớ lâu hơn? Ôn thêm vài thẻ.</p>
          <ButtonLink to="/review" variant="secondary" className="mt-4">
            Ôn thêm <Icon name="chevron-right" size={16} strokeWidth={2.4} />
          </ButtonLink>
        </div>
        {/* Dấu ✓ đã nằm trong câu (E2E bám đúng câu đó) nên vòng màu dùng ngọn lửa: chuỗi ngày đã giữ được. */}
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
      inProgress.reviewsLeft > 0 && `${inProgress.reviewsLeft} thẻ ôn`,
      inProgress.newLeft > 0 && `${inProgress.newLeft} từ mới`,
    ].filter(Boolean);
    headline = parts.length ? `Còn ${parts.join(' · ')}` : 'Còn bài chính';
    detail = `Đã ôn ${inProgress.cardsDone} thẻ — làm tiếp từ chỗ dừng.`;
  } else {
    const minutes = dailyMinutes ? ` · khoảng ${dailyMinutes} phút` : '';
    if (summary.dueCount > 0) {
      headline = `${summary.dueCount} thẻ cần ôn`;
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
        <p className="mt-1.5 text-[1.375rem] font-bold leading-tight tracking-[-0.02em] tabular-nums text-text">{headline}</p>
        <p className="mt-1 text-[0.9375rem] leading-snug text-text-2">{detail}</p>
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

function UnitCard({ unit }: { unit: Summary['currentUnit'] }) {
  if (!unit) {
    return (
      <Card className="flex items-center gap-4">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-text">
          <Icon name="star" size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[1rem] font-semibold text-text">Bạn đã học hết nội dung hiện có.</p>
          <Link to="/roadmap" className="focus-ring mt-0.5 inline-block rounded text-[0.9375rem] font-semibold text-accent-text">Xem lộ trình</Link>
        </div>
      </Card>
    );
  }
  const ratio = unit.lessonsTotal ? unit.lessonsDone / unit.lessonsTotal : 0;
  return (
    <Card>
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <Eyebrow>Đang học</Eyebrow>
          <p className="mt-1.5 text-[1.0625rem] font-semibold leading-snug text-text">
            <span className="text-text-3">{unit.code}</span> · {unit.title}
          </p>
        </div>
        <p aria-hidden="true" className="shrink-0 text-[2.5rem] font-bold leading-none tracking-[-0.03em] tabular-nums text-text">
          {Math.round(ratio * 100)}<span className="text-[1.25rem] text-text-3">%</span>
        </p>
      </div>
      <ProgressBar value={ratio} label={`Tiến độ unit ${unit.code}`} className="mt-4" />
      <div className="mt-2.5 flex items-center justify-between gap-3">
        <p className="text-[0.875rem] tabular-nums text-text-3">{unit.lessonsDone}/{unit.lessonsTotal} bài</p>
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
      <h2 id="today-practice" className="text-[1.25rem] font-bold tracking-[-0.015em] text-text">Luyện tập</h2>
      <div className="grid grid-cols-4 gap-2.5 sm:gap-3 lg:grid-cols-2">
        <PracticeTile to="/review" label="Ôn thẻ" icon="cards" tone="VOCAB" />
        <PracticeTile to="/words" label="Kho từ" icon="book" tone="READING" />
        <PracticeTile to="/ipa" label="Phát âm IPA" icon="mic" tone="PRONUNCIATION" />
        <PracticeTile to="/roadmap" label="Lộ trình" ariaLabel="Mở lộ trình" icon="map" tone="LISTENING" />
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
  if (s.streak > 0) return `Học hôm nay để giữ chuỗi ${s.streak} ngày.`;
  return 'Mỗi ngày một chút — bắt đầu thôi.';
}

export default function TodayPage() {
  const summaryQuery = useQuery({ queryKey: ['summary'], queryFn: endpoints.summary });
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
              <StatTile icon="flame" tone="warning" value={s.streak} label="ngày liên tiếp" testId="today-streak" />
              <StatTile icon="cards" tone="VOCAB" value={s.dueCount} label="thẻ đến hạn" testId="today-due" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
