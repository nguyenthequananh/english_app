import { useDeferredValue, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import type { AddWord, WordStatus } from '../api/types';
import { QueryError } from '../components/query-error';
import { SpeakButton } from '../components/speak-button';
import { toast } from '../components/toaster';
import { WORD_STATUS_LABEL } from '../components/labels';

export default function WordBankPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<WordStatus | ''>('');
  const [adding, setAdding] = useState(false);
  const deferredQ = useDeferredValue(q);
  const wordsQuery = useQuery({ queryKey: ['words', deferredQ, status], queryFn: () => endpoints.words(deferredQ, status) });
  const { data } = wordsQuery;

  return (
    <div data-testid="page-words" className="space-y-4">
      <h1 className="text-2xl font-bold">Kho từ</h1>
      <div className="flex flex-wrap gap-3">
        <input className="input max-w-xs" aria-label="Tìm từ" placeholder="Tìm từ hoặc nghĩa…" value={q}
          onChange={(e) => setQ(e.target.value)} />
        <label className="flex items-center gap-2 text-sm">
          Trạng thái
          <select className="input w-auto" aria-label="Trạng thái" value={status} onChange={(e) => setStatus(e.target.value as WordStatus | '')}>
            <option value="">Tất cả</option>
            <option value="NEW">Mới</option>
            <option value="LEARNING">Đang học</option>
            <option value="KNOWN">Đã thuộc</option>
          </select>
        </label>
        {!adding && <button type="button" className="btn btn-primary ml-auto" onClick={() => setAdding(true)}>Thêm từ của bạn</button>}
      </div>

      {adding && <AddWordForm onClose={() => setAdding(false)} />}

      {wordsQuery.error && <QueryError error={wordsQuery.error} onRetry={() => wordsQuery.refetch()} />}
      {data && data.length === 0 && <p className="text-slate-500">Không có từ nào</p>}
      {data && data.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr><th className="p-2">Từ</th><th className="p-2">Loại</th><th className="p-2">Nghĩa</th><th className="p-2">Trạng thái</th><th className="p-2">Ôn lại</th></tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.word.id} className="border-t border-slate-100">
                  <td className="p-2 font-medium">{item.word.headword} <SpeakButton text={item.word.headword} /></td>
                  <td className="p-2">{item.word.pos}</td>
                  <td className="p-2">{item.word.meaningVi}</td>
                  <td className="p-2">{WORD_STATUS_LABEL[item.status]}</td>
                  <td className="p-2">{item.dueDate ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const EMPTY: AddWord = { headword: '', pos: '', ipaUs: '', meaningVi: '', exampleEn: '', exampleVi: '' };

function AddWordForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AddWord>(EMPTY);
  const add = useMutation({
    mutationFn: () => endpoints.addWord(form),
    onSuccess: () => {
      toast('Đã thêm từ');
      queryClient.invalidateQueries({ queryKey: ['words'] });
      onClose();
    },
  });
  const field = (key: keyof AddWord, label: string, required = false) => (
    <div>
      <label htmlFor={`w-${key}`} className="mb-1 block text-sm font-medium">{label}</label>
      <input id={`w-${key}`} className="input" required={required} value={form[key] ?? ''}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
    </div>
  );
  return (
    <form className="card grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        add.mutate();
      }}>
      {field('headword', 'Từ', true)}
      {field('pos', 'Loại từ', true)}
      {field('ipaUs', 'IPA')}
      {field('meaningVi', 'Nghĩa tiếng Việt', true)}
      {field('exampleEn', 'Câu ví dụ')}
      {field('exampleVi', 'Nghĩa câu ví dụ')}
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" className="btn btn-primary" disabled={add.isPending}>Lưu từ</button>
        <button type="button" className="btn bg-slate-100" onClick={onClose}>Huỷ</button>
      </div>
    </form>
  );
}
