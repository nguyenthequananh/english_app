import type { ReactNode } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { AnimatePresence, motion, MotionConfig, useDragControls, type HTMLMotionProps, type PanInfo } from 'motion/react';
import { Icon } from './icons';
import { DESKTOP_QUERY, useMediaQuery } from './use-media-query';

/* Lò xo kiểu ngăn kéo iOS (damping ~0.8, response ~0.35): có quán tính nhẹ nhưng không nảy lộ. */
const SHEET_SPRING = { type: 'spring', bounce: 0.14, duration: 0.42 } as const;
/* Đóng nhanh hơn mở: hệ thống đáp lại thì phải gọn. */
const SHEET_EXIT = { type: 'spring', bounce: 0, duration: 0.28 } as const;

/**
 * Bảng trượt: điện thoại — trượt từ đáy lên (lò xo, kéo thanh nắm xuống để đóng);
 * ≥lg — hộp thoại giữa màn. Dựa trên base-ui Dialog (bẫy focus, Esc, chạm nền để đóng).
 */
export function Sheet({ open, onOpenChange, title, description, children }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const dragControls = useDragControls();

  function onDragEnd(_: unknown, info: PanInfo) {
    // Vuốt nhanh là đủ (theo vận tốc), không bắt kéo quá ngưỡng.
    if (info.offset.y > 120 || info.velocity.y > 600) onOpenChange(false);
  }

  const motionProps: HTMLMotionProps<'div'> = desktop
    ? {
        initial: { opacity: 0, scale: 0.96 },
        animate: { opacity: 1, scale: 1, transition: { type: 'spring' as const, bounce: 0, duration: 0.3 } },
        exit: { opacity: 0, scale: 0.97, transition: { duration: 0.16 } },
      }
    : {
        initial: { opacity: 1, y: '100%' },
        animate: { opacity: 1, y: 0, transition: SHEET_SPRING },
        // Có opacity trong exit để base-ui nhận ra hoạt ảnh đóng và chờ nó xong; mờ ở cuối, khi bảng gần khuất.
        exit: { y: '100%', opacity: 0, transition: { y: SHEET_EXIT, opacity: { duration: 0.1, delay: 0.18 } } },
        drag: 'y' as const,
        dragListener: false,
        dragControls,
        dragConstraints: { top: 0, bottom: 0 },
        dragElastic: { top: 0.04, bottom: 0.7 },
        onDragEnd,
      };

  return (
    <Dialog.Root open={open} onOpenChange={(next) => onOpenChange(next)}>
      <MotionConfig reducedMotion="user">
        <AnimatePresence>
          {open && (
            <Dialog.Portal keepMounted>
              <Dialog.Backdrop
                className="fixed inset-0 z-50 bg-[var(--scrim)]"
                render={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} />}
              />
              <Dialog.Viewport className="fixed inset-0 z-50 flex items-end justify-center lg:items-center lg:p-8">
                <Dialog.Popup
                  className="flex max-h-[min(88dvh,760px)] w-full flex-col overflow-hidden rounded-t-[28px] bg-surface text-text shadow-[var(--shadow-sheet),inset_0_0_0_1px_var(--card-border)] outline-none lg:max-w-[520px] lg:rounded-[28px]"
                  render={<motion.div {...motionProps} />}
                >
                  <div
                    className="shrink-0 touch-none px-5 pt-2 lg:touch-auto lg:pt-5"
                    onPointerDown={(e) => { if (!desktop) dragControls.start(e); }}
                  >
                    <div aria-hidden="true" className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-fill-strong lg:hidden" />
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1 pt-1.5">
                        <Dialog.Title className="text-[1.1875rem] font-bold leading-snug tracking-[-0.015em]">{title}</Dialog.Title>
                        {description && (
                          <Dialog.Description className="mt-1 text-[0.9375rem] leading-snug text-text-2">{description}</Dialog.Description>
                        )}
                      </div>
                      <Dialog.Close
                        aria-label="Đóng"
                        className="pressable focus-ring -mr-1.5 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-text-2"
                      >
                        <span className="inline-flex size-8 items-center justify-center rounded-full bg-fill">
                          <Icon name="close" size={16} strokeWidth={2.4} />
                        </span>
                      </Dialog.Close>
                    </div>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] lg:pb-6">
                    {children}
                  </div>
                </Dialog.Popup>
              </Dialog.Viewport>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </MotionConfig>
    </Dialog.Root>
  );
}
