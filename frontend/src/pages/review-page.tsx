import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import { Flashcard } from '../components/flashcard';
import { QueryError } from '../components/query-error';
import type { Grade } from '../api/types';

export default function ReviewPage() {
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);
  const cardsQuery = useQuery({ queryKey: ['dueCards'], queryFn: () => endpoints.dueCards(200), staleTime: Infinity, gcTime: 0 });
  const cards = cardsQuery.data;
  const review = useMutation({
    mutationFn: ({ wordId, grade }: { wordId: number; grade: Grade }) => endpoints.reviewCard(wordId, grade),
    onSuccess: () => {
      setIndex((i) => i + 1);
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
  });

  if (cardsQuery.error) {
    return <QueryError error={cardsQuery.error} onRetry={() => cardsQuery.refetch()} backTo={{ to: '/', label: 'Về trang chủ' }} />;
  }
  if (!cards) return <p className="text-slate-500">Đang tải thẻ…</p>;
  const card = cards[index];
  if (!card) {
    return (
      <div className="card space-y-3 text-center">
        <p className="text-lg">Không còn thẻ nào đến hạn. Tuyệt!</p>
        <Link to="/" className="btn btn-primary">Về trang chủ</Link>
      </div>
    );
  }
  return (
    <div data-testid="page-review" className="space-y-3">
      <p className="text-sm text-slate-500">Ôn thêm: thẻ {index + 1}/{cards.length}</p>
      <Flashcard key={card.id} word={card} busy={review.isPending}
        onGrade={(grade) => review.mutate({ wordId: card.id, grade })} />
    </div>
  );
}
