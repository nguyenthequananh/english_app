import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import { SUMMARY_KEY } from '../api/query-keys';
import { Flashcard } from '../components/flashcard';
import { QueryError } from '../components/query-error';
import { ButtonLink } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { EmptyState } from '../components/ui/empty-state';
import { ProgressBar } from '../components/ui/progress-bar';
import { Skeleton } from '../components/ui/skeleton';
import { TopBar } from '../components/ui/top-bar';
import type { Grade } from '../types/api';

export default function ReviewPage() {
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);
  const cardsQuery = useQuery({ queryKey: ['dueCards'], queryFn: () => endpoints.dueCards(200), staleTime: Infinity, gcTime: 0 });
  const cards = cardsQuery.data;
  const review = useMutation({
    mutationFn: ({ wordId, grade }: { wordId: number; grade: Grade }) => endpoints.reviewCard(wordId, grade),
    onSuccess: () => {
      setIndex((i) => i + 1);
      queryClient.invalidateQueries({ queryKey: SUMMARY_KEY });
    },
  });

  const card = cards?.[index];
  const left = cards ? Math.max(0, cards.length - index) : 0;
  const topBar = <TopBar title="Ôn thẻ" subtitle={card ? `Còn ${left} thẻ` : undefined} back="/" />;

  if (cardsQuery.error) {
    return (
      <>
        {topBar}
        <div className="pt-2">
          <QueryError error={cardsQuery.error} onRetry={() => cardsQuery.refetch()} backTo={{ to: '/', label: 'Về trang chủ' }} />
        </div>
      </>
    );
  }
  if (!cards) {
    return (
      <>
        {topBar}
        <div className="space-y-5 pt-1">
          <span role="status" className="sr-only">Đang tải thẻ…</span>
          <Skeleton className="h-1.5 rounded-full" />
          <Skeleton className="h-[clamp(18rem,calc(100dvh_-_16rem),34rem)] rounded-card" />
          <Skeleton className="h-14 rounded-full" />
        </div>
      </>
    );
  }
  if (!card) {
    return (
      <>
        {topBar}
        <div data-testid="page-review" className="pt-2">
          <Card>
            <EmptyState
              icon="check"
              title="Không còn thẻ nào đến hạn. Tuyệt!"
              description={index > 0 ? `Bạn vừa ôn ${index} thẻ. Thẻ sẽ quay lại đúng ngày cần ôn.` : 'Thẻ sẽ quay lại đúng ngày cần ôn — chưa cần làm gì thêm.'}
              action={<ButtonLink to="/" size="lg">Về trang chủ</ButtonLink>}
            />
          </Card>
        </div>
      </>
    );
  }
  return (
    <>
      {topBar}
      <div data-testid="page-review" className="space-y-5 pt-1">
        <ProgressBar value={index / cards.length} label="Tiến độ ôn thẻ" />
        {/* Thẻ từ thứ hai trở đi hiện ra sau một lần chấm ⇒ nhận lại focus (index về 0 mỗi lần mở trang). */}
        <Flashcard key={card.id} word={card} busy={review.isPending} focusOnMount={index > 0}
          onGrade={(grade) => review.mutate({ wordId: card.id, grade })} />
      </div>
    </>
  );
}
