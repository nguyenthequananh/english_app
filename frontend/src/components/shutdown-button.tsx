import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';

export function ShutdownButton() {
  const [stopped, setStopped] = useState(false);
  const shutdown = useMutation({ mutationFn: endpoints.shutdown, onSuccess: () => setStopped(true) });
  return (
    <>
      <button type="button" className="btn btn-danger" disabled={shutdown.isPending}
        onClick={() => {
          if (window.confirm('Tắt app? Trang này sẽ ngừng hoạt động cho tới khi bạn mở lại app.')) shutdown.mutate();
        }}>
        Tắt app
      </button>
      {stopped && createPortal(
        <div data-testid="app-stopped" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 text-center text-xl text-white">
          App đã tắt. Bạn có thể đóng tab này.
        </div>,
        document.body,
      )}
    </>
  );
}
