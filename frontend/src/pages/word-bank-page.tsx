import { useDeferredValue, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import type { AddWord, WordBankItem, WordStatus } from '../types/api';
import { QueryError } from '../components/query-error';
import { SpeakButton } from '../components/speak-button';
import { toast } from '../components/toaster';
import { WORD_STATUS_LABEL } from '../components/labels';
import { PageHeader } from '../components/ui/page-header';
import { Button } from '../components/ui/button';
import { TextField } from '../components/ui/text-field';
import { Segmented } from '../components/ui/segmented';
import { Sheet } from '../components/ui/sheet';
import { Badge } from '../components/ui/badge';
import { EmptyState } from '../components/ui/empty-state';
import { Skeleton } from '../components/ui/skeleton';
import { Icon } from '../components/ui/icons';

type Filter = 'ALL' | WordStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'NEW', label: 'Mới' },
  { value: 'LEARNING', label: 'Đang học' },
  { value: 'KNOWN', label: 'Đã thuộc' },
];

const STATUS_TONE = { NEW: 'neutral', LEARNING: 'warning', KNOWN: 'success' } as const;

/** Backend trả tối đa 200 từ mỗi lần tìm. */
const RESULT_LIMIT = 200;

/*
 * MỘT cấu trúc DOM cho mọi bề ngang: mỗi từ là một `role="row"` (data-testid="word-row").
 * <lg: thẻ danh sách (vùng lưới word/ipa/mean/status/due + loa bên phải);
 * ≥lg: cùng các ô xếp thành cột như bảng, có hàng tiêu đề.
 */
const ROW_GRID = [
  'grid items-center gap-x-3',
  'grid-cols-[auto_minmax(0,1fr)_auto] [grid-template-areas:"word_word_speak"_"ipa_ipa_speak"_"mean_mean_speak"_"status_due_due"]',
  'lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.9fr)_minmax(0,1.9fr)_6.5rem_6rem_2.75rem] lg:[grid-template-areas:"word_ipa_mean_status_due_speak"] lg:gap-x-4',
].join(' ');

function formatDue(iso: string | null) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-');
  return y === String(new Date().getFullYear()) ? `${d}/${m}` : `${d}/${m}/${y}`;
}

function WordRow({ item }: { item: WordBankItem }) {
  const { word } = item;
  const ipa = word.ipaUs ?? word.ipaUk;
  const due = formatDue(item.dueDate);
  return (
    <div
      role="row"
      data-testid="word-row"
      className={`${ROW_GRID} px-4 py-3 lg:py-2 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-separator`}
    >
      <div role="cell" className="min-w-0 [grid-area:word]">
        <span className="text-lg font-semibold break-words text-text lg:text-base">{word.headword}</span>
        {' '}<span className="text-sm whitespace-nowrap italic text-text-3">{word.pos}</span>
      </div>
      <div role="cell" className={`min-w-0 text-base break-words text-text-2 [grid-area:ipa] ${ipa ? '' : 'max-lg:hidden'}`}>
        {ipa ?? <span aria-label="Chưa có IPA" className="text-text-3">—</span>}
      </div>
      <div role="cell" className="mt-1 min-w-0 text-base break-words text-text [grid-area:mean] lg:mt-0">
        {word.meaningVi}
      </div>
      <div role="cell" className="mt-2 [grid-area:status] lg:mt-0">
        <Badge tone={STATUS_TONE[item.status]}>{WORD_STATUS_LABEL[item.status]}</Badge>
      </div>
      <div role="cell" className="mt-2 min-w-0 text-sm tabular-nums text-text-3 [grid-area:due] lg:mt-0 lg:text-md lg:text-text-2">
        {due ? <><span className="lg:hidden">Ôn lại </span>{due}</> : <span className="max-lg:hidden" aria-label="Chưa có lịch ôn">—</span>}
      </div>
      <div role="cell" className="self-start justify-self-end [grid-area:speak] lg:self-center">
        <SpeakButton text={word.headword} />
      </div>
    </div>
  );
}

function WordTable({ items }: { items: WordBankItem[] }) {
  return (
    <div role="table" aria-label="Danh sách từ" className="overflow-hidden rounded-card bg-surface card-edge">
      <div role="rowgroup" className="hidden border-b border-separator bg-fill/40 lg:block">
        <div role="row" className={`${ROW_GRID} px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.04em] text-text-3`}>
          <div role="columnheader" className="[grid-area:word]">Từ</div>
          <div role="columnheader" className="[grid-area:ipa]">IPA</div>
          <div role="columnheader" className="[grid-area:mean]">Nghĩa</div>
          <div role="columnheader" className="[grid-area:status]">Trạng thái</div>
          <div role="columnheader" className="[grid-area:due]">Ôn lại</div>
          <div role="columnheader" className="[grid-area:speak]"><span className="sr-only">Nghe</span></div>
        </div>
      </div>
      <div role="rowgroup">
        {items.map((item) => <WordRow key={item.word.id} item={item} />)}
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="overflow-hidden rounded-card bg-surface card-edge" aria-busy="true">
      <span className="sr-only">Đang tải…</span>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-4 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-separator">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
          <Skeleton className="size-11 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function WordBankPage() {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');
  const [adding, setAdding] = useState(false);
  const deferredQ = useDeferredValue(q);
  const status: WordStatus | '' = filter === 'ALL' ? '' : filter;
  const wordsQuery = useQuery({ queryKey: ['words', deferredQ, status], queryFn: () => endpoints.words(deferredQ, status),
    // Giữ danh sách cũ trong lúc tải kết quả lọc/tìm mới (mờ đi) thay vì nháy về khung xương.
    placeholderData: (prev) => prev,
  });
  const { data } = wordsQuery;
  const searching = Boolean(deferredQ.trim()) || filter !== 'ALL';

  return (
    <div data-testid="page-words">
      <PageHeader
        title="Kho từ"
        back="/"
        backLabel="Về Hôm nay"
        actions={
          <Button size="sm" onClick={() => setAdding(true)}>
            <Icon name="plus" size={17} strokeWidth={2.4} />
            Thêm từ
          </Button>
        }
      />

      <div className="mb-4 space-y-3 lg:flex lg:items-center lg:gap-4 lg:space-y-0">
        <div className="relative lg:flex-1">
          <Icon name="search" size={18} strokeWidth={2.1} className="pointer-events-none absolute top-1/2 left-3.5 z-[1] -translate-y-1/2 text-text-3" />
          <TextField
            label="Tìm từ"
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Tìm từ hoặc nghĩa…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="[&_input]:pl-10 [&>label]:sr-only"
          />
        </div>
        <Segmented label="Trạng thái" value={filter} onChange={setFilter} options={FILTERS} className="lg:w-[26rem]" />
      </div>

      {wordsQuery.error ? (
        <QueryError error={wordsQuery.error} onRetry={() => wordsQuery.refetch()} />
      ) : !data ? (
        <ListSkeleton />
      ) : data.length === 0 ? (
        <div className="rounded-card bg-surface card-edge">
          <EmptyState
            icon={searching ? 'search' : 'cards'}
            title="Không có từ nào"
            description={searching ? 'Thử từ khoá khác hoặc chọn “Tất cả”.' : 'Từ sẽ xuất hiện ở đây khi bạn học buổi đầu tiên, hoặc tự thêm từ của bạn.'}
            action={!searching && <Button variant="secondary" onClick={() => setAdding(true)}>Thêm từ</Button>}
          />
        </div>
      ) : (
        <>
          <p className="mb-2 px-1 text-sm tabular-nums text-text-3" aria-live="polite">
            {data.length >= RESULT_LIMIT ? `Hiện ${RESULT_LIMIT} từ đầu tiên — gõ để tìm chính xác hơn` : `${data.length} từ`}
          </p>
          <div className={`transition-opacity duration-(--duration-fast) ${wordsQuery.isPlaceholderData ? 'opacity-55' : ''}`}>
            <WordTable items={data} />
          </div>
        </>
      )}

      <Sheet open={adding} onOpenChange={setAdding} title="Thêm từ của bạn" description="Từ mới sẽ vào thẻ ôn như các từ khác.">
        <AddWordForm onDone={() => setAdding(false)} />
      </Sheet>
    </div>
  );
}

const EMPTY: AddWord = { headword: '', pos: '', ipaUs: '', meaningVi: '', exampleEn: '', exampleVi: '' };
const OPTIONAL = ['ipaUs', 'exampleEn', 'exampleVi'] as const;

/** Bỏ trường tuỳ chọn để trống (không gửi chuỗi rỗng); trường bắt buộc được cắt khoảng trắng. */
function toPayload(form: AddWord): AddWord {
  const body: AddWord = { headword: form.headword.trim(), pos: form.pos.trim(), meaningVi: form.meaningVi.trim() };
  for (const key of OPTIONAL) {
    const v = form[key]?.trim();
    if (v) body[key] = v;
  }
  return body;
}

function AddWordForm({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AddWord>(EMPTY);
  const add = useMutation({
    mutationFn: () => endpoints.addWord(toPayload(form)),
    onSuccess: () => {
      toast('Đã thêm từ');
      queryClient.invalidateQueries({ queryKey: ['words'] });
      onDone();
    },
  });
  const bind = (key: keyof AddWord) => ({
    value: form[key] ?? '',
    onChange: (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.headword.trim() || !form.pos.trim() || !form.meaningVi.trim()) return;
    add.mutate();
  }
  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="grid grid-cols-[minmax(0,1fr)_8.5rem] gap-3">
        <TextField label="Từ" required autoCapitalize="none" spellCheck={false} {...bind('headword')} />
        <TextField label="Loại từ" required autoCapitalize="none" placeholder="noun, verb…" {...bind('pos')} />
      </div>
      <TextField label="Nghĩa tiếng Việt" required {...bind('meaningVi')} />
      <fieldset className="space-y-4 border-t border-separator pt-4">
        <legend className="float-left mb-1 w-full px-1 text-sm font-semibold uppercase tracking-[0.04em] text-text-3">Không bắt buộc</legend>
        <TextField label="IPA" autoCapitalize="none" spellCheck={false} placeholder="VD: /bʊk/" {...bind('ipaUs')} />
        <TextField label="Câu ví dụ" autoCapitalize="sentences" {...bind('exampleEn')} />
        <TextField label="Nghĩa câu ví dụ" {...bind('exampleVi')} />
      </fieldset>
      <Button type="submit" block size="lg" loading={add.isPending}>Lưu từ</Button>
    </form>
  );
}
