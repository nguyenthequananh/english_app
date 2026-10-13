import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Button } from './button';

/**
 * Hộp xác nhận (thay `window.confirm`) — base-ui AlertDialog: `role="alertdialog"`, bẫy focus,
 * không đóng khi chạm nền (phải chọn rõ ràng). Chỉ dùng cho thao tác khó hoàn tác.
 * Hiện giữa màn, phóng nhẹ từ 0.96 (hộp thoại không gắn với nút bấm nên giữ tâm ở giữa).
 */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, cancelLabel = 'Huỷ', destructive = false, onConfirm }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => onOpenChange(next)}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop
          className="fixed inset-0 z-50 bg-[var(--scrim)] transition-opacity duration-(--duration-fast) ease-out data-[ending-style]:opacity-0 data-[starting-style]:opacity-0"
        />
        <AlertDialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <AlertDialog.Popup
            className="w-full max-w-[340px] rounded-[26px] bg-surface p-5 text-center text-text shadow-[var(--shadow-sheet),inset_0_0_0_1px_var(--card-border)] outline-none transition-[opacity,scale] duration-(--duration-fast) ease-[var(--ease-out)] data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0 data-[ending-style]:duration-(--duration-press) data-[starting-style]:scale-[0.96] data-[starting-style]:opacity-0"
          >
            <AlertDialog.Title className="text-[1.0625rem] font-bold leading-snug tracking-[-0.01em]">{title}</AlertDialog.Title>
            {description && (
              <AlertDialog.Description className="mt-1.5 text-[0.9375rem] leading-snug text-pretty text-text-2">{description}</AlertDialog.Description>
            )}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
              <AlertDialog.Close render={<Button variant="secondary" block className="sm:flex-1" />}>{cancelLabel}</AlertDialog.Close>
              <Button
                variant={destructive ? 'danger-solid' : 'primary'}
                block
                className="sm:flex-1"
                onClick={() => {
                  onConfirm();
                  onOpenChange(false);
                }}
              >
                {confirmLabel}
              </Button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
