import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import { Button } from '../ui/button';
import { ConfirmDialog } from '../ui/dialog';
import { Icon } from '../ui/icons';

export function ShutdownButton() {
  const [confirming, setConfirming] = useState(false);
  const [stopped, setStopped] = useState(false);
  const shutdown = useMutation({ mutationFn: endpoints.shutdown, onSuccess: () => setStopped(true) });
  return (
    <>
      <Button variant="danger" loading={shutdown.isPending} onClick={() => setConfirming(true)}>
        <Icon name="power" size={18} strokeWidth={2.2} />
        Tắt app
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Tắt app?"
        description="Trang này sẽ ngừng hoạt động cho tới khi bạn mở lại app."
        confirmLabel="Tắt app"
        destructive
        onConfirm={() => shutdown.mutate()}
      />
      {stopped && createPortal(
        <div data-testid="app-stopped" className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-bg p-6 text-center">
          <span className="inline-flex size-16 items-center justify-center rounded-full bg-fill text-text-2">
            <Icon name="power" size={30} />
          </span>
          <p className="text-2xl font-bold text-text">App đã tắt. Bạn có thể đóng tab này.</p>
        </div>,
        document.body,
      )}
    </>
  );
}
