import { useEffect, useState } from 'react';
import { ApiError } from '../api/api-error';

interface ToastItem { id: number; message: string; kind: 'info' | 'error' }

let items: ToastItem[] = [];
let listeners: ((t: ToastItem[]) => void)[] = [];
let nextId = 1;

function emit() {
  listeners.forEach((l) => l(items));
}

export function toast(message: string, kind: ToastItem['kind'] = 'info') {
  const item = { id: nextId++, message, kind };
  items = [...items, item];
  emit();
  setTimeout(() => {
    items = items.filter((t) => t.id !== item.id);
    emit();
  }, 6000);
}

export function notifyError(e: unknown) {
  if (e instanceof ApiError) {
    if (e.code !== 'PROFILE_REQUIRED') toast(e.message, 'error');
  } else {
    toast('Có lỗi không mong muốn', 'error');
  }
}

export function Toaster() {
  const [current, setCurrent] = useState<ToastItem[]>(items);
  useEffect(() => {
    listeners.push(setCurrent);
    return () => {
      listeners = listeners.filter((l) => l !== setCurrent);
    };
  }, []);
  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2" role="status">
      {current.map((t) => (
        <div key={t.id}
          className={`rounded-lg px-4 py-3 text-sm shadow-lg ${t.kind === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-white'}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
